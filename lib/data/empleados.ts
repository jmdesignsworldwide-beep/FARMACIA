import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import type { Rol } from "@/lib/auth/roles";

export type Empleado = {
  id: string;
  username: string;
  full_name: string | null;
  rol: Rol;
  cedula: string | null;
  telefono: string | null;
  cargo: string | null;
  turno: string | null;
  activo: boolean;
  created_at: string;
};

export type Actividad = {
  id: string;
  empleado_id: string | null;
  empleado_nombre: string | null;
  rol: string | null;
  tipo: string;
  descripcion: string;
  detalle: Record<string, any>;
  ref_tabla: string | null;
  ref_id: string | null;
  created_at: string;
};

const COLS = "id, username, full_name, rol, cedula, telefono, cargo, turno, activo, created_at";

/** Empleado de la sesión actual (lee su propio perfil, permitido por RLS). */
export async function getCurrentEmpleado(): Promise<Empleado | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select(COLS).eq("id", user.id).maybeSingle();
  return (data as Empleado) ?? null;
}

/** Lista de empleados (requiere service_role; gatear con capacidad antes). */
export async function getEmpleados(q?: string): Promise<Empleado[]> {
  if (!isAdminConfigured()) return [];
  const admin = createAdminClient();
  let query = admin.from("profiles").select(COLS).order("created_at", { ascending: true });
  if (q) {
    const s = q.replace(/[%,]/g, " ").trim();
    query = query.or(`full_name.ilike.%${s}%,username.ilike.%${s}%,cedula.ilike.%${s}%`);
  }
  const { data } = await query;
  return (data ?? []) as Empleado[];
}

export async function getEmpleado(id: string): Promise<Empleado | null> {
  if (!isAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select(COLS).eq("id", id).maybeSingle();
  return (data as Empleado) ?? null;
}

export type ActividadFiltros = { empleadoId?: string; tipo?: string };

/** Historial de actividad (global o filtrado). RLS permite leer a autenticados. */
export async function getActividad(filtros: ActividadFiltros = {}, limit = 100): Promise<Actividad[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  let query = supabase.from("actividad").select("*").order("created_at", { ascending: false }).limit(limit);
  if (filtros.empleadoId) query = query.eq("empleado_id", filtros.empleadoId);
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
  const { data } = await query;
  return (data ?? []) as Actividad[];
}

export async function getActividadEvento(id: string): Promise<Actividad | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data } = await supabase.from("actividad").select("*").eq("id", id).maybeSingle();
  return (data as Actividad) ?? null;
}
