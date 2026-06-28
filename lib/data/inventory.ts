import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export { CATEGORIAS } from "./categorias";

// ── Tipos ──────────────────────────────────────────────────────
export type Producto = {
  id: string;
  nombre_comercial: string;
  nombre_generico: string;
  laboratorio: string | null;
  concentracion: string | null;
  presentacion: string | null;
  categoria: string;
  codigo_barras: string | null;
  precio_costo: number;
  precio_venta: number;
  margen_pct: number;
  controlado: boolean;
  requiere_receta: boolean;
  stock_minimo: number;
  unidades_por_caja: number;
  vende_caja: boolean;
  precio_caja: number;
  vende_unidad: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductoConStock = Producto & {
  stock_total: number;
  lotes_count: number;
  proximo_vencimiento: string | null;
  bajo_stock: boolean;
};

export type Lote = {
  id: string;
  producto_id: string;
  numero_lote: string;
  cantidad: number;
  fecha_vencimiento: string;
  proveedor: string | null;
  fecha_entrada: string;
};

export type Movimiento = {
  id: string;
  producto_id: string;
  lote_id: string | null;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  motivo: string | null;
  created_at: string;
  productos: { nombre_comercial: string; nombre_generico: string } | null;
};

export type ProductoFiltros = {
  q?: string;
  categoria?: string;
  controlado?: boolean;
  receta?: boolean;
  bajoStock?: boolean;
};

// ── Consultas ──────────────────────────────────────────────────

/** Listado de productos con stock (suma de lotes), buscable y filtrable. */
export async function getProductos(
  filtros: ProductoFiltros = {},
): Promise<ProductoConStock[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  let query = supabase
    .from("productos_con_stock")
    .select("*")
    .eq("activo", true)
    .order("nombre_comercial", { ascending: true });

  if (filtros.q) {
    const q = filtros.q.replace(/[%,]/g, " ").trim();
    query = query.or(
      `nombre_comercial.ilike.%${q}%,nombre_generico.ilike.%${q}%,codigo_barras.ilike.%${q}%`,
    );
  }
  if (filtros.categoria) query = query.eq("categoria", filtros.categoria);
  if (filtros.controlado) query = query.eq("controlado", true);
  if (filtros.receta) query = query.eq("requiere_receta", true);
  if (filtros.bajoStock) query = query.eq("bajo_stock", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductoConStock[];
}

/** Un producto con stock + sus lotes (ordenados por vencimiento). */
export async function getProductoDetalle(id: string): Promise<{
  producto: ProductoConStock;
  lotes: Lote[];
} | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const [{ data: producto }, { data: lotes }] = await Promise.all([
    supabase.from("productos_con_stock").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("lotes")
      .select("*")
      .eq("producto_id", id)
      .order("fecha_vencimiento", { ascending: true }),
  ]);
  if (!producto) return null;
  return {
    producto: producto as ProductoConStock,
    lotes: (lotes ?? []) as Lote[],
  };
}

/** Lista corta para selectores (entrada de mercancía). */
export async function getProductosBasico(): Promise<
  Pick<Producto, "id" | "nombre_comercial" | "nombre_generico" | "presentacion" | "codigo_barras" | "unidades_por_caja">[]
> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("productos")
    .select("id, nombre_comercial, nombre_generico, presentacion, codigo_barras, unidades_por_caja")
    .eq("activo", true)
    .order("nombre_comercial");
  return data ?? [];
}

/** Historial de movimientos recientes. */
export async function getMovimientos(limit = 40): Promise<Movimiento[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("movimientos_inventario")
    .select("*, productos(nombre_comercial, nombre_generico)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Movimiento[];
}

export type LoteConProducto = Lote & {
  productos: {
    nombre_comercial: string;
    nombre_generico: string;
    presentacion: string | null;
  } | null;
  dias_para_vencer: number;
};

/** Lotes que vencen dentro de `dias` (por defecto 90), con días restantes. */
export async function getLotesPorVencer(
  dias = 90,
): Promise<LoteConProducto[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const limite = new Date();
  limite.setDate(limite.getDate() + dias);
  const { data } = await supabase
    .from("lotes")
    .select(
      "*, productos(nombre_comercial, nombre_generico, presentacion)",
    )
    .gt("cantidad", 0)
    .lte("fecha_vencimiento", limite.toISOString().slice(0, 10))
    .order("fecha_vencimiento", { ascending: true });

  const hoy = new Date();
  return (data ?? []).map((l: any) => {
    const dpv = Math.ceil(
      (new Date(l.fecha_vencimiento).getTime() - hoy.getTime()) /
        86_400_000,
    );
    return { ...l, dias_para_vencer: dpv } as LoteConProducto;
  });
}

export type InventoryStats = {
  totalProductos: number;
  bajoStock: ProductoConStock[];
  ventanaAlerta: number;
  porVencerAlerta: number;
  porVencer30: number;
  porVencer60: number;
  porVencer90: number;
};

/** Estadísticas para encabezados y para alimentar el dashboard. Obedece la config. */
export async function getInventoryStats(): Promise<InventoryStats> {
  if (!isSupabaseConfigured())
    return { totalProductos: 0, bajoStock: [], ventanaAlerta: 30, porVencerAlerta: 0, porVencer30: 0, porVencer60: 0, porVencer90: 0 };

  const { getConfig } = await import("./config");
  const [productos, porVencer, config] = await Promise.all([
    getProductos(),
    getLotesPorVencer(90),
    getConfig(),
  ]);
  const ventana = config.dias_alerta_vencimiento;

  return {
    totalProductos: productos.length,
    bajoStock: productos.filter((p) => p.stock_total <= Math.max(p.stock_minimo, config.stock_minimo_default)),
    ventanaAlerta: ventana,
    porVencerAlerta: porVencer.filter((l) => l.dias_para_vencer <= ventana).length,
    porVencer30: porVencer.filter((l) => l.dias_para_vencer <= 30).length,
    porVencer60: porVencer.filter((l) => l.dias_para_vencer <= 60).length,
    porVencer90: porVencer.filter((l) => l.dias_para_vencer <= 90).length,
  };
}
