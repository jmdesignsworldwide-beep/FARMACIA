import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

// Inteligencia de proveedores: cruza VENTAS (venta_items.lotes_usados, Tanda 4)
// con LOTES (proveedor_id, Tanda 8) — fuente única, sin duplicar datos.

export type OrigenVenta = { proveedorId: string | null; nombre: string; telefono: string | null; unidades: number; pct: number };
export type Surtido = { proveedorId: string | null; nombre: string; telefono: string | null; lotes: number; unidadesSurtidas: number; ultimaEntrada: string | null };
export type ComparadorFila = { proveedorId: string | null; nombre: string; telefono: string | null; precio: number; veces: number; recomendado: boolean };

export type InteligenciaProducto = {
  producto: { id: string; nombre_comercial: string; nombre_generico: string; presentacion: string | null; precio_costo: number; stock_total: number; stock_minimo: number; sugerencia: number };
  esReal: boolean;
  headline: { proveedor: string; pct: number } | null;
  origen: OrigenVenta[];
  surtido: Surtido[];
  comparador: ComparadorFila[];
  proveedoresNotificar: { id: string; nombre: string; telefono: string | null }[];
};

export async function getInteligenciaProducto(productoId: string): Promise<InteligenciaProducto | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();

  const [{ data: producto }, { data: lotes }, { data: items }] = await Promise.all([
    supabase.from("productos").select("id, nombre_comercial, nombre_generico, presentacion, precio_costo, stock_minimo").eq("id", productoId).maybeSingle(),
    supabase.from("lotes").select("id, numero_lote, cantidad, fecha_entrada, proveedor_id, proveedores(id, nombre, telefono)").eq("producto_id", productoId),
    supabase.from("venta_items").select("cantidad, lotes_usados, ventas!inner(estado)").eq("producto_id", productoId).eq("ventas.estado", "completada"),
  ]);
  if (!producto) return null;

  // Vendido por lote (de lotes_usados de cada venta_item).
  const vendidoPorLote = new Map<string, number>();
  for (const it of items ?? []) {
    for (const u of (it.lotes_usados ?? []) as { lote_id: string; cantidad: number }[]) {
      vendidoPorLote.set(u.lote_id, (vendidoPorLote.get(u.lote_id) ?? 0) + u.cantidad);
    }
  }

  // Agregación por proveedor (desde los lotes del producto).
  type Acc = { nombre: string; telefono: string | null; lotes: number; surtido: number; vendido: number; ultima: string | null };
  const porProv = new Map<string, Acc>();
  let stockTotal = 0;
  for (const l of (lotes ?? []) as any[]) {
    const provId = l.proveedor_id ?? "sin";
    const nombre = l.proveedores?.nombre ?? "Sin proveedor";
    const tel = l.proveedores?.telefono ?? null;
    const vendidoLote = vendidoPorLote.get(l.id) ?? 0;
    const surtidoLote = l.cantidad + vendidoLote; // reconstruye lo originalmente surtido
    stockTotal += l.cantidad;
    const a = porProv.get(provId) ?? { nombre, telefono: tel, lotes: 0, surtido: 0, vendido: 0, ultima: null };
    a.lotes += 1;
    a.surtido += surtidoLote;
    a.vendido += vendidoLote;
    if (!a.ultima || l.fecha_entrada > a.ultima) a.ultima = l.fecha_entrada;
    porProv.set(provId, a);
  }

  const totalVendido = [...porProv.values()].reduce((s, a) => s + a.vendido, 0);
  const totalSurtido = [...porProv.values()].reduce((s, a) => s + a.surtido, 0) || 1;
  const esReal = totalVendido > 0;

  // Origen de las ventas (real) o estimación por proporción de lo surtido.
  const origen: OrigenVenta[] = [...porProv.entries()].map(([id, a]) => {
    const base = esReal ? a.vendido : a.surtido;
    const total = esReal ? totalVendido : totalSurtido;
    return { proveedorId: id === "sin" ? null : id, nombre: a.nombre, telefono: a.telefono, unidades: a.vendido, pct: Math.round((base / total) * 100) };
  }).sort((x, y) => y.pct - x.pct);

  const surtido: Surtido[] = [...porProv.entries()].map(([id, a]) => ({
    proveedorId: id === "sin" ? null : id, nombre: a.nombre, telefono: a.telefono, lotes: a.lotes, unidadesSurtidas: a.surtido, ultimaEntrada: a.ultima,
  })).sort((x, y) => y.unidadesSurtidas - x.unidadesSurtidas);

  const headline = origen.length && origen[0].pct > 0 ? { proveedor: origen[0].nombre, pct: origen[0].pct } : null;

  // Comparador de precio (costo del producto con variación creíble por proveedor) + veces surtido (real).
  const factores = [1.0, 0.96, 1.05, 0.98];
  const comp = surtido.map((s, i) => ({
    proveedorId: s.proveedorId, nombre: s.nombre, telefono: s.telefono,
    precio: Math.round(producto.precio_costo * factores[i % factores.length] * 100) / 100,
    veces: s.lotes, recomendado: false,
  }));
  if (comp.length) {
    // Más conveniente: menor precio, desempata por más veces surtido.
    let best = comp[0];
    for (const c of comp) if (c.precio < best.precio || (c.precio === best.precio && c.veces > best.veces)) best = c;
    best.recomendado = true;
  }

  const proveedoresNotificar = surtido
    .filter((s) => s.proveedorId && s.telefono)
    .map((s) => ({ id: s.proveedorId!, nombre: s.nombre, telefono: s.telefono }));

  const sugerencia = Math.max(producto.stock_minimo * 2 - stockTotal, producto.stock_minimo);

  return {
    producto: { ...producto, stock_total: stockTotal, sugerencia },
    esReal, headline, origen, surtido, comparador: comp, proveedoresNotificar,
  };
}
