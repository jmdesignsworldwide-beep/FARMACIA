import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatRD } from "@/lib/utils";
import { getCajaActual, getCajaResumen } from "./ventas";
import { metodoLabel } from "./ventas-shared";
import {
  muestraFlujo,
  type FinanzasData,
  type FinanzasPeriodo,
  type MetodoBreak,
  type ProductoRent,
  type SerieFin,
  type VentaLinea,
  type GastoLinea,
  type CategoriaGasto,
  type Tendencias,
  type Insights,
} from "./finanzas-shared";

export * from "./finanzas-shared";

const pctChange = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : 0);

/** Genera frases en cristiano a partir de los datos (reales o de muestra). */
function construirInsights(d: {
  capitalDormido: number;
  dormidoCount: number;
  masRentables: ProductoRent[];
  tendencias: Tendencias;
}): Insights {
  const patrimonio =
    d.capitalDormido > 0 && d.dormidoCount > 0
      ? `Tienes ${formatRD(d.capitalDormido)} dormidos en ${d.dormidoCount} producto${d.dormidoCount === 1 ? "" : "s"} que no rotan — conviene moverlos o liquidarlos.`
      : "Tu inventario rota bien: casi no hay capital dormido.";
  const top = d.masRentables[0];
  const rentable = top
    ? `Tu producto de mayor margen es ${top.nombre}, con ${top.margenPct}% de margen.`
    : "Aún no hay datos de margen por producto.";
  const ts = d.tendencias.salio;
  const salidas =
    ts.pct === 0
      ? "Tus salidas se mantienen igual que el período anterior."
      : `Tus salidas (compras + gastos) ${ts.pct > 0 ? "subieron" : "bajaron"} ${Math.abs(ts.pct)}% vs el período anterior${ts.mejor ? ", y tu proporción de gasto mejoró." : "."}`;
  return { patrimonio, rentable, salidas };
}

/** Umbral de ventas reales para dejar de usar la muestra del FLUJO. */
const MIN_REAL = 15;

const ISO = (d: Date) => d.toISOString();
const YMD = (d: Date) => d.toISOString().slice(0, 10);

type Rango = { desde: Date; hasta: Date; prevDesde: Date; prevHasta: Date };

function calcularRango(periodo: FinanzasPeriodo, customDesde?: string, customHasta?: string): Rango {
  const hasta = new Date();
  const desde = new Date();
  desde.setHours(0, 0, 0, 0);

  if (periodo === "custom" && customDesde && customHasta) {
    const d = new Date(customDesde + "T00:00:00");
    const h = new Date(customHasta + "T23:59:59");
    const len = h.getTime() - d.getTime();
    return { desde: d, hasta: h, prevDesde: new Date(d.getTime() - len), prevHasta: new Date(d.getTime() - 1) };
  }
  if (periodo === "semana") desde.setDate(desde.getDate() - 6);
  else if (periodo === "mes") desde.setDate(desde.getDate() - 29);
  // "dia" → desde = hoy 00:00

  const len = hasta.getTime() - desde.getTime();
  return { desde, hasta, prevDesde: new Date(desde.getTime() - len), prevHasta: new Date(desde.getTime() - 1) };
}

export async function getFinanzas(
  periodo: FinanzasPeriodo = "mes",
  customDesde?: string,
  customHasta?: string,
): Promise<FinanzasData> {
  const { desde, hasta, prevDesde, prevHasta } = calcularRango(periodo, customDesde, customHasta);
  const periodoMuestra = (periodo === "custom" ? "mes" : periodo) as "dia" | "semana" | "mes";

  // Patrimonio y salud por defecto (se rellenan con lo real abajo).
  const base = {
    periodo,
    desde: YMD(desde),
    hasta: YMD(hasta),
    valorInventario: 0,
    plataEnCaja: 0,
    capitalDormido: 0,
    dormidoCount: 0,
    masRentables: [] as ProductoRent[],
    menosRentables: [] as ProductoRent[],
    ventasDetalle: [] as VentaLinea[],
    gastosDetalle: [] as GastoLinea[],
  };

  const demoMuestra = () => {
    const flujo = muestraFlujo(periodoMuestra);
    const insights = construirInsights({
      capitalDormido: base.capitalDormido,
      dormidoCount: base.dormidoCount,
      masRentables: base.masRentables,
      tendencias: flujo.tendencias,
    });
    return { ...base, esDemo: true as const, ...flujo, insights };
  };

  if (!isSupabaseConfigured()) {
    return demoMuestra();
  }

  const supabase = createClient();
  const hace60 = new Date();
  hace60.setDate(hace60.getDate() - 60);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [
    { data: ventas },
    { data: prevVentas },
    { data: productos },
    { data: lotesStock },
    { data: lotesCompra },
    { data: egresos },
    { data: ventasRecientes },
    { data: deliveries },
    { data: prevEgresos },
    { data: prevLotesCompra },
    { data: prevItems },
    { data: ventasMes },
    cajaActual,
  ] = await Promise.all([
    supabase.from("ventas").select("id, folio, total, metodo_pago, created_at").eq("estado", "completada").gte("created_at", ISO(desde)).lte("created_at", ISO(hasta)),
    supabase.from("ventas").select("total").eq("estado", "completada").gte("created_at", ISO(prevDesde)).lte("created_at", ISO(prevHasta)),
    supabase.from("productos").select("id, nombre_comercial, precio_costo, precio_venta, margen_pct").eq("activo", true),
    supabase.from("lotes").select("producto_id, cantidad").gt("cantidad", 0),
    supabase.from("lotes").select("producto_id, cantidad, fecha_entrada").gte("fecha_entrada", YMD(desde)).lte("fecha_entrada", YMD(hasta)),
    supabase.from("caja_egresos").select("monto, motivo, created_at").gte("created_at", ISO(desde)).lte("created_at", ISO(hasta)),
    supabase.from("venta_items").select("producto_id, ventas!inner(created_at, estado)").eq("ventas.estado", "completada").gte("ventas.created_at", ISO(hace60)),
    supabase.from("deliveries").select("monto").eq("estado", "entregado").gte("created_at", ISO(desde)).lte("created_at", ISO(hasta)),
    supabase.from("caja_egresos").select("monto").gte("created_at", ISO(prevDesde)).lte("created_at", ISO(prevHasta)),
    supabase.from("lotes").select("producto_id, cantidad").gte("fecha_entrada", YMD(prevDesde)).lte("fecha_entrada", YMD(prevHasta)),
    supabase.from("venta_items").select("producto_id, cantidad, ventas!inner(created_at, estado)").eq("ventas.estado", "completada").gte("ventas.created_at", ISO(prevDesde)).lte("ventas.created_at", ISO(prevHasta)),
    supabase.from("ventas").select("total").eq("estado", "completada").gte("created_at", ISO(inicioMes)),
    getCajaActual(),
  ]);

  // Mapa de costos por producto.
  const costo = new Map<string, number>();
  for (const p of productos ?? []) costo.set(p.id, Number(p.precio_costo) || 0);

  // ── Patrimonio (SIEMPRE real) ──
  const valorPorProducto = new Map<string, number>();
  let valorInventario = 0;
  for (const l of lotesStock ?? []) {
    const v = Number(l.cantidad) * (costo.get(l.producto_id) ?? 0);
    valorInventario += v;
    valorPorProducto.set(l.producto_id, (valorPorProducto.get(l.producto_id) ?? 0) + v);
  }

  const vendidosRecientes = new Set<string>();
  for (const it of ventasRecientes ?? []) if (it.producto_id) vendidosRecientes.add(it.producto_id);
  let capitalDormido = 0;
  let dormidoCount = 0;
  for (const [pid, val] of valorPorProducto) {
    if (!vendidosRecientes.has(pid)) {
      capitalDormido += val;
      dormidoCount += 1;
    }
  }

  const plataEnCaja = cajaActual ? (await getCajaResumen(cajaActual)).efectivoEsperado : 0;

  // ── Más / menos rentables (real, del catálogo) ──
  const rent: ProductoRent[] = (productos ?? [])
    .filter((p) => Number(p.precio_costo) > 0)
    .map((p) => ({
      productoId: p.id,
      nombre: p.nombre_comercial,
      margenPct: Math.round(Number(p.margen_pct) || 0),
      costo: Number(p.precio_costo),
      venta: Number(p.precio_venta),
    }));
  const porMargen = [...rent].sort((a, b) => b.margenPct - a.margenPct);
  const masRentables = porMargen.slice(0, 5);
  const menosRentables = porMargen.slice(-5).reverse();

  base.valorInventario = Math.round(valorInventario);
  base.plataEnCaja = Math.round(plataEnCaja);
  base.capitalDormido = Math.round(capitalDormido);
  base.dormidoCount = dormidoCount;
  base.masRentables = masRentables;
  base.menosRentables = menosRentables;

  // ── ¿Hay suficientes ventas reales para el FLUJO? ──
  const v = ventas ?? [];
  if (v.length < MIN_REAL) {
    return demoMuestra();
  }

  // ── FLUJO real ──
  const entro = v.reduce((s, x) => s + Number(x.total), 0);
  const ventasDetalle: VentaLinea[] = v
    .map((x) => ({ id: x.id, folio: x.folio, total: Number(x.total), metodo: x.metodo_pago, created_at: x.created_at }))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  // Costo de lo vendido (COGS) desde los ítems de estas ventas.
  const ids = v.map((x) => x.id);
  const { data: items } = await supabase.from("venta_items").select("producto_id, cantidad").in("venta_id", ids);
  let cogs = 0;
  for (const it of items ?? []) {
    if (it.producto_id) cogs += Number(it.cantidad) * (costo.get(it.producto_id) ?? 0);
  }
  const ganancia = Math.max(entro - cogs, 0);
  const margenPct = entro > 0 ? Math.round((ganancia / entro) * 100) : 0;

  // Período anterior (real): ingresos, COGS, ganancia y margen para tendencias.
  const prevIngresos = (prevVentas ?? []).reduce((s, x) => s + Number(x.total), 0);
  let prevCogs = 0;
  for (const it of prevItems ?? []) if (it.producto_id) prevCogs += Number(it.cantidad) * (costo.get(it.producto_id) ?? 0);
  const gananciaPrev = Math.round(Math.max(prevIngresos - prevCogs, 0));
  const prevMargen = prevIngresos > 0 ? (gananciaPrev / prevIngresos) * 100 : 0;
  const tendenciaPct = pctChange(ganancia, gananciaPrev);

  // Por método de pago.
  const porMetMap = new Map<string, number>();
  for (const x of v) porMetMap.set(x.metodo_pago, (porMetMap.get(x.metodo_pago) ?? 0) + Number(x.total));
  const porMetodo: MetodoBreak[] = [...porMetMap.entries()]
    .map(([m, monto]) => ({ metodo: metodoLabel(m), monto, pct: entro > 0 ? Math.round((monto / entro) * 100) : 0 }))
    .sort((a, b) => b.monto - a.monto);

  // Mostrador vs delivery (delivery = canal de entregas).
  const delivery = (deliveries ?? []).reduce((s, d) => s + Number(d.monto), 0);
  const mostrador = entro;

  // Salidas: compras (mercancía a costo) + gastos operativos (egresos de caja).
  let compras = 0;
  for (const l of lotesCompra ?? []) compras += Number(l.cantidad) * (costo.get(l.producto_id) ?? 0);
  compras = Math.round(compras);

  const gastosDetalle: GastoLinea[] = (egresos ?? [])
    .map((e) => ({ motivo: e.motivo ?? "Gasto", monto: Number(e.monto), created_at: e.created_at }))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const catMap = new Map<string, number>();
  for (const e of gastosDetalle) {
    const cat = categorizar(e.motivo);
    catMap.set(cat, (catMap.get(cat) ?? 0) + e.monto);
  }
  const gastos: CategoriaGasto[] = [...catMap.entries()].map(([categoria, monto]) => ({ categoria, monto })).sort((a, b) => b.monto - a.monto);
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
  const salio = compras + totalGastos;

  // Salidas del período anterior (para la tendencia y su proporción).
  let prevCompras = 0;
  for (const l of prevLotesCompra ?? []) prevCompras += Number(l.cantidad) * (costo.get(l.producto_id) ?? 0);
  const prevGastos = (prevEgresos ?? []).reduce((s, e) => s + Number(e.monto), 0);
  const prevSalio = prevCompras + prevGastos;
  const ratioActual = entro > 0 ? salio / entro : 0;
  const ratioPrev = prevIngresos > 0 ? prevSalio / prevIngresos : 0;

  // Tendencias ↑↓ en cada número clave (con criterio por concepto).
  const tendencias: Tendencias = {
    entro: { pct: pctChange(entro, prevIngresos), mejor: entro >= prevIngresos },
    salio: { pct: pctChange(salio, prevSalio), mejor: ratioActual <= ratioPrev },
    ganancia: { pct: pctChange(ganancia, gananciaPrev), mejor: ganancia >= gananciaPrev },
    margen: { pct: Math.round(margenPct - prevMargen), mejor: margenPct >= prevMargen },
  };

  // Proyección de cierre de mes (calendario) al ritmo actual.
  const ventasMesTotal = (ventasMes ?? []).reduce((s, x) => s + Number(x.total), 0);
  const hoy = new Date();
  const diaDelMes = hoy.getDate();
  const diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const proyeccion =
    ventasMesTotal > 0 && diaDelMes > 0
      ? {
          ventas: Math.round((ventasMesTotal / diaDelMes) * diasMes),
          ganancia: Math.round((ventasMesTotal / diaDelMes) * diasMes * (margenPct / 100)),
          pctMes: Math.round((diaDelMes / diasMes) * 100),
        }
      : null;

  const insights = construirInsights({
    capitalDormido: base.capitalDormido,
    dormidoCount: base.dormidoCount,
    masRentables: base.masRentables,
    tendencias,
  });

  // Serie ingresos vs egresos por día del período.
  const serie = serieReal(v, gastosDetalle, compras);

  return {
    ...base,
    esDemo: false,
    entro: Math.round(entro),
    salio: Math.round(salio),
    ganancia: Math.round(ganancia),
    margenPct,
    gananciaPrev,
    tendenciaPct,
    ventasCount: v.length,
    porMetodo,
    mostrador: Math.round(mostrador),
    delivery: Math.round(delivery),
    ventasDetalle,
    compras,
    gastos,
    totalGastos,
    gastosDetalle,
    serie,
    tendencias,
    proyeccion,
    insights,
  };
}

/** Clasifica un egreso de caja en una categoría legible según su motivo. */
function categorizar(motivo: string): string {
  const m = motivo.toLowerCase();
  if (/(compra|proveedor|mercanc|pedido)/.test(m)) return "Compras a proveedores";
  if (/(nómina|nomina|sueldo|salario|pago empleado)/.test(m)) return "Nómina";
  if (/(alquiler|renta|local)/.test(m)) return "Alquiler";
  if (/(luz|agua|electric|servicio|internet|teléfono|telefono)/.test(m)) return "Servicios";
  return "Otros gastos";
}

/** Agrega ventas (ingresos) y egresos por día para el gráfico de flujo. */
function serieReal(
  ventas: { total: number; created_at: string }[],
  egresos: { monto: number; created_at: string }[],
  compras: number,
): SerieFin[] {
  const acc = new Map<string, { ingresos: number; egresos: number; orden: string }>();
  const get = (iso: string) => {
    const key = new Date(iso).toLocaleDateString("es-DO", { day: "numeric", month: "short" });
    const orden = iso.slice(0, 10);
    const cur = acc.get(key) ?? { ingresos: 0, egresos: 0, orden };
    acc.set(key, cur);
    return cur;
  };
  for (const v of ventas) get(v.created_at).ingresos += Number(v.total);
  for (const e of egresos) get(e.created_at).egresos += Number(e.monto);
  // Reparte las compras del período en el primer día con actividad (aproximación visual).
  const first = [...acc.values()].sort((a, b) => (a.orden < b.orden ? -1 : 1))[0];
  if (first) first.egresos += compras;

  return [...acc.entries()]
    .map(([label, val]) => ({ label, ingresos: Math.round(val.ingresos), egresos: Math.round(val.egresos), orden: val.orden }))
    .sort((a, b) => (a.orden < b.orden ? -1 : 1))
    .map(({ label, ingresos, egresos }) => ({ label, ingresos, egresos }));
}
