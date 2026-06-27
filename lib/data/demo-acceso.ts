import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import type { DemoAcceso, MiAcceso } from "./demo-acceso-shared";

export * from "./demo-acceso-shared";

const COLS = "id, user_id, username, es_admin_demo, vence_at, dias_otorgados, activo, notas, created_at";

/**
 * Acceso de demo del usuario ACTUAL (vía RPC SECURITY DEFINER).
 * `null` cuando no hay fila (cuenta sin restricción de demo, p. ej. personal interno).
 */
export async function getMiAccesoDemo(): Promise<MiAcceso | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("mi_acceso_demo");
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    esAdminDemo: Boolean(row.es_admin_demo),
    venceAt: row.vence_at ?? null,
    activo: Boolean(row.activo),
    vigente: Boolean(row.vigente),
  };
}

/** ¿La sesión actual es admin del demo (JM Designs)? Se valida en el SERVIDOR. */
export async function isAdminDemo(): Promise<boolean> {
  const acceso = await getMiAccesoDemo();
  return Boolean(acceso?.esAdminDemo);
}

/** Lista de cuentas de demo (requiere service_role; gatear con isAdminDemo antes). */
export async function getDemoAccesos(): Promise<DemoAcceso[]> {
  if (!isAdminConfigured()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("demo_accesos")
    .select(COLS)
    .order("created_at", { ascending: false });
  return (data ?? []) as DemoAcceso[];
}

export async function getDemoAcceso(id: string): Promise<DemoAcceso | null> {
  if (!isAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("demo_accesos").select(COLS).eq("id", id).maybeSingle();
  return (data as DemoAcceso) ?? null;
}
