import "server-only";
import { createClient as createAdmin } from "@supabase/supabase-js";

/**
 * Cliente Supabase con service_role — SOLO servidor. Omite RLS.
 * Se usa para gestionar empleados (crear usuarios de auth, listar perfiles).
 * Nunca debe exponerse al navegador.
 */
export function createAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** ¿Está configurada la service_role? (para degradar con elegancia.) */
export function isAdminConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
