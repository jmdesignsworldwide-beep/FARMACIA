import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Proveedor, ProveedorBasico } from "./proveedores-shared";

export * from "./proveedores-shared";

export async function getProveedores(q?: string): Promise<Proveedor[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  let query = supabase.from("proveedores").select("*").order("nombre", { ascending: true }).limit(150);
  if (q) {
    const s = q.replace(/[%,]/g, " ").trim();
    query = query.or(`nombre.ilike.%${s}%,rnc.ilike.%${s}%,telefono.ilike.%${s}%`);
  }
  const { data } = await query;
  return (data ?? []) as Proveedor[];
}

export async function getProveedoresBasico(): Promise<ProveedorBasico[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase.from("proveedores").select("id, nombre").eq("activo", true).order("nombre");
  return (data ?? []) as ProveedorBasico[];
}

export async function getProveedor(id: string): Promise<Proveedor | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data } = await supabase.from("proveedores").select("*").eq("id", id).maybeSingle();
  return (data as Proveedor) ?? null;
}

export type LoteSurtido = {
  id: string;
  numero_lote: string;
  cantidad: number;
  fecha_entrada: string;
  fecha_vencimiento: string;
  producto: string;
  costo_total: number;
};

/** Lotes surtidos por el proveedor (por vínculo real o por nombre). */
export async function getProveedorLotes(prov: Proveedor): Promise<LoteSurtido[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("lotes")
    .select("id, numero_lote, cantidad, fecha_entrada, fecha_vencimiento, proveedor, proveedor_id, productos(nombre_comercial, precio_costo)")
    .or(`proveedor_id.eq.${prov.id},proveedor.eq.${prov.nombre}`)
    .order("fecha_entrada", { ascending: false });

  return (data ?? []).map((l: any) => ({
    id: l.id,
    numero_lote: l.numero_lote,
    cantidad: l.cantidad,
    fecha_entrada: l.fecha_entrada,
    fecha_vencimiento: l.fecha_vencimiento,
    producto: l.productos?.nombre_comercial ?? "Producto",
    costo_total: (l.productos?.precio_costo ?? 0) * l.cantidad,
  })) as LoteSurtido[];
}
