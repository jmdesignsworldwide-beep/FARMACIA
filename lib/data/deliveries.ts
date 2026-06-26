import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import type { Delivery } from "./deliveries-shared";

export * from "./deliveries-shared";

export type DeliveryFiltros = { motoristaId?: string; estado?: string };

export async function getDeliveries(filtros: DeliveryFiltros = {}): Promise<Delivery[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  let query = supabase.from("deliveries").select("*").order("created_at", { ascending: false }).limit(150);
  if (filtros.motoristaId) query = query.eq("motorista_id", filtros.motoristaId);
  if (filtros.estado) query = query.eq("estado", filtros.estado);
  const { data } = await query;
  return (data ?? []) as Delivery[];
}

export async function getDelivery(id: string): Promise<Delivery | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data } = await supabase.from("deliveries").select("*").eq("id", id).maybeSingle();
  return (data as Delivery) ?? null;
}

export type Motorista = { id: string; nombre: string };

/** Motoristas para asignar (usa service_role; gatear con capacidad antes). */
export async function getMotoristas(): Promise<Motorista[]> {
  if (!isAdminConfigured()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, username")
    .eq("rol", "motorista")
    .eq("activo", true);
  return (data ?? []).map((m: any) => ({ id: m.id, nombre: m.full_name ?? m.username }));
}
