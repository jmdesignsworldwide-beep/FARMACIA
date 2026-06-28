import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { recetaVencida } from "./recetas-shared";
import type {
  Receta, RecetaItem, RecetaResumen, LibroEntry, ProductoReceta,
} from "./recetas-shared";

export * from "./recetas-shared";

/** Productos para el selector de recetas (incluye flag de controlado). */
export async function getProductosParaReceta(): Promise<ProductoReceta[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("productos")
    .select("id, nombre_comercial, nombre_generico, presentacion, controlado")
    .eq("activo", true)
    .order("nombre_comercial");
  return (data ?? []) as ProductoReceta[];
}

/** Médicos ya registrados (distintos) para autocompletar. */
export async function getMedicosSugeridos(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase.from("recetas").select("medico_nombre").not("medico_nombre", "is", null);
  return [...new Set((data ?? []).map((d: any) => d.medico_nombre).filter(Boolean))].sort() as string[];
}

/** Listado de recetas (busca por paciente, médico o número). */
export async function getRecetas(q?: string): Promise<RecetaResumen[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  let query = supabase
    .from("recetas")
    .select("*, receta_items(count)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) {
    const s = q.replace(/[%,]/g, " ").trim();
    query = query.or(`paciente_nombre.ilike.%${s}%,medico_nombre.ilike.%${s}%,numero.ilike.%${s}%`);
  }
  const { data } = await query;
  return (data ?? []).map((r: any) => ({ ...r, items_count: r.receta_items?.[0]?.count ?? 0 })) as RecetaResumen[];
}

export async function getReceta(id: string): Promise<{ receta: Receta; items: RecetaItem[] } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const [{ data: receta }, { data: items }] = await Promise.all([
    supabase.from("recetas").select("*").eq("id", id).maybeSingle(),
    supabase.from("receta_items").select("*").eq("receta_id", id),
  ]);
  if (!receta) return null;
  return { receta: receta as Receta, items: (items ?? []) as RecetaItem[] };
}

export type LibroFiltros = { q?: string; productoId?: string };

export async function getLibro(filtros: LibroFiltros = {}): Promise<LibroEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  let query = supabase.from("libro_controlados").select("*").order("created_at", { ascending: false }).limit(150);
  if (filtros.productoId) query = query.eq("producto_id", filtros.productoId);
  if (filtros.q) {
    const s = filtros.q.replace(/[%,]/g, " ").trim();
    query = query.or(`paciente_nombre.ilike.%${s}%,producto_nombre.ilike.%${s}%,numero_receta.ilike.%${s}%`);
  }
  const { data } = await query;
  return (data ?? []) as LibroEntry[];
}

export async function getLibroEntry(id: string): Promise<LibroEntry | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data } = await supabase.from("libro_controlados").select("*").eq("id", id).maybeSingle();
  return (data as LibroEntry) ?? null;
}

export type ControladosReporte = {
  totalDespachos: number;
  totalUnidades: number;
  porProducto: { nombre: string; unidades: number; despachos: number }[];
  recetasVencidas: RecetaResumen[];
};

/** Reporte navegable de controlados + alertas de recetas vencidas. */
export async function getControladosReporte(): Promise<ControladosReporte> {
  if (!isSupabaseConfigured())
    return { totalDespachos: 0, totalUnidades: 0, porProducto: [], recetasVencidas: [] };
  const supabase = createClient();
  const [{ data: libro }, recetas] = await Promise.all([
    supabase.from("libro_controlados").select("producto_nombre, cantidad"),
    getRecetas(),
  ]);

  const acc = new Map<string, { unidades: number; despachos: number }>();
  let totalUnidades = 0;
  for (const e of libro ?? []) {
    const cur = acc.get(e.producto_nombre) ?? { unidades: 0, despachos: 0 };
    cur.unidades += e.cantidad;
    cur.despachos += 1;
    acc.set(e.producto_nombre, cur);
    totalUnidades += e.cantidad;
  }
  const porProducto = [...acc.entries()]
    .map(([nombre, v]) => ({ nombre, ...v }))
    .sort((a, b) => b.unidades - a.unidades);

  const recetasVencidas = recetas.filter((r) => recetaVencida(r));

  return {
    totalDespachos: libro?.length ?? 0,
    totalUnidades,
    porProducto,
    recetasVencidas,
  };
}
