import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { CONFIG_DEFAULT, type Config } from "./config-shared";

export * from "./config-shared";

/** Lee la configuración (fila única). Devuelve defaults si no hay/está sin conectar. */
export async function getConfig(): Promise<Config> {
  if (!isSupabaseConfigured()) return CONFIG_DEFAULT;
  const supabase = createClient();
  const { data } = await supabase
    .from("configuracion")
    .select("nombre_farmacia, logo_url, rnc, direccion, telefono, stock_minimo_default, dias_alerta_vencimiento, metodos_pago")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return CONFIG_DEFAULT;
  return {
    ...CONFIG_DEFAULT,
    ...data,
    metodos_pago: { ...CONFIG_DEFAULT.metodos_pago, ...(data.metodos_pago ?? {}) },
  } as Config;
}
