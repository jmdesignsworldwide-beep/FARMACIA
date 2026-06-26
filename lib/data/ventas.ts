import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ProductoVendible,
  LoteVendible,
  Caja,
  CajaResumen,
  EgresoRow,
  Venta,
  VentaItem,
  VentaResumen,
  VentasHoy,
} from "./ventas-shared";

// Reexporta tipos y helpers compartidos para el código de servidor.
export * from "./ventas-shared";

// ── Consultas ──────────────────────────────────────────────────

/** Productos vendibles (con stock) y sus lotes ordenados FEFO. */
export async function getProductosVendibles(): Promise<ProductoVendible[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const [{ data: productos }, { data: lotes }] = await Promise.all([
    supabase
      .from("productos_con_stock")
      .select(
        "id, nombre_comercial, nombre_generico, concentracion, presentacion, categoria, codigo_barras, precio_venta, controlado, requiere_receta, stock_total",
      )
      .eq("activo", true)
      .gt("stock_total", 0)
      .order("nombre_comercial"),
    supabase
      .from("lotes")
      .select("id, producto_id, numero_lote, cantidad, fecha_vencimiento")
      .gt("cantidad", 0)
      .order("fecha_vencimiento", { ascending: true }),
  ]);

  const porProducto = new Map<string, LoteVendible[]>();
  for (const l of lotes ?? []) {
    const arr = porProducto.get(l.producto_id) ?? [];
    arr.push(l);
    porProducto.set(l.producto_id, arr);
  }

  return (productos ?? []).map((p: any) => ({
    ...p,
    lotes: porProducto.get(p.id) ?? [],
  })) as ProductoVendible[];
}

/** Caja abierta actual (o null). */
export async function getCajaActual(): Promise<Caja | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("cajas")
    .select("*")
    .eq("estado", "abierta")
    .order("abierta_at", { ascending: false })
    .maybeSingle();
  return (data as Caja) ?? null;
}

/** Resumen de una caja: ventas por método, egresos y efectivo esperado. */
export async function getCajaResumen(caja: Caja): Promise<CajaResumen> {
  const supabase = createClient();
  const [{ data: ventas }, { data: egresos }] = await Promise.all([
    supabase
      .from("ventas")
      .select("total, metodo_pago")
      .eq("caja_id", caja.id)
      .eq("estado", "completada"),
    supabase.from("caja_egresos").select("monto").eq("caja_id", caja.id),
  ]);

  const porMetodo: Record<string, number> = {};
  let totalVentas = 0;
  for (const v of ventas ?? []) {
    porMetodo[v.metodo_pago] = (porMetodo[v.metodo_pago] ?? 0) + Number(v.total);
    totalVentas += Number(v.total);
  }
  const totalEgresos = (egresos ?? []).reduce((s, e) => s + Number(e.monto), 0);
  const efectivoEsperado =
    Number(caja.monto_inicial) + (porMetodo["efectivo"] ?? 0) - totalEgresos;

  return {
    caja,
    ventasCount: ventas?.length ?? 0,
    totalVentas,
    porMetodo,
    totalEgresos,
    efectivoEsperado,
  };
}

export async function getEgresos(cajaId: string): Promise<EgresoRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("caja_egresos")
    .select("id, monto, motivo, created_at")
    .eq("caja_id", cajaId)
    .order("created_at", { ascending: false });
  return (data ?? []) as EgresoRow[];
}

/** Listado de ventas (busca por folio). Si se pasa empleadoId, solo las suyas. */
export async function getVentas(q?: string, empleadoId?: string): Promise<VentaResumen[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  let query = supabase
    .from("ventas")
    .select("id, folio, total, metodo_pago, estado, empleado_nombre, created_at, venta_items(count)")
    .order("created_at", { ascending: false })
    .limit(80);
  if (empleadoId) query = query.eq("empleado_id", empleadoId);
  if (q && /^\d+$/.test(q.trim())) query = query.eq("folio", Number(q.trim()));

  const { data } = await query;
  return (data ?? []).map((v: any) => ({
    ...v,
    items_count: v.venta_items?.[0]?.count ?? 0,
  })) as VentaResumen[];
}

export async function getVentaDetalle(
  id: string,
): Promise<{ venta: Venta; items: VentaItem[] } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const [{ data: venta }, { data: items }] = await Promise.all([
    supabase.from("ventas").select("*").eq("id", id).maybeSingle(),
    supabase.from("venta_items").select("*").eq("venta_id", id),
  ]);
  if (!venta) return null;
  return { venta: venta as Venta, items: (items ?? []) as VentaItem[] };
}

/** Resumen de ventas de HOY (alimenta el dashboard). */
export async function getVentasHoy(): Promise<VentasHoy> {
  if (!isSupabaseConfigured())
    return { total: 0, count: 0, porMetodo: {}, topProducto: null, ticketPromedio: 0 };
  const supabase = createClient();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const { data: ventas } = await supabase
    .from("ventas")
    .select("id, total, metodo_pago")
    .eq("estado", "completada")
    .gte("created_at", hoy.toISOString());

  const ids = (ventas ?? []).map((v) => v.id);
  let topProducto: VentasHoy["topProducto"] = null;
  if (ids.length) {
    const { data: items } = await supabase
      .from("venta_items")
      .select("nombre_producto, cantidad")
      .in("venta_id", ids);
    const acc = new Map<string, number>();
    for (const it of items ?? [])
      acc.set(it.nombre_producto, (acc.get(it.nombre_producto) ?? 0) + it.cantidad);
    const top = [...acc.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) topProducto = { nombre: top[0], unidades: top[1] };
  }

  const porMetodo: Record<string, number> = {};
  let total = 0;
  for (const v of ventas ?? []) {
    porMetodo[v.metodo_pago] = (porMetodo[v.metodo_pago] ?? 0) + Number(v.total);
    total += Number(v.total);
  }
  const count = ventas?.length ?? 0;
  return {
    total,
    count,
    porMetodo,
    topProducto,
    ticketPromedio: count ? total / count : 0,
  };
}
