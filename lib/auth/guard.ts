import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmpleado, type Empleado } from "@/lib/data/empleados";
import { can, homePathForRol, type Capacidad } from "./roles";

/** Registra un intento de acceso no autorizado en el historial. */
async function logDenegado(cap: Capacidad) {
  try {
    const supabase = createClient();
    await supabase.rpc("registrar_actividad", {
      p_tipo: "acceso_denegado",
      p_desc: `Intento de acceso no autorizado: ${cap}`,
      p_detalle: { capacidad: cap },
    });
  } catch {
    // No bloquear por fallo de registro.
  }
}

/**
 * Exige una capacidad en una PÁGINA (Server Component).
 * Si no hay sesión → /login. Si no tiene permiso → registra y redirige a su inicio.
 */
export async function requireCapability(cap: Capacidad): Promise<Empleado> {
  const emp = await getCurrentEmpleado();
  if (!emp) redirect("/login");
  if (!can(emp.rol, cap)) {
    await logDenegado(cap);
    redirect(homePathForRol(emp.rol));
  }
  return emp;
}

/** Versión para Server Actions: no redirige, devuelve resultado. */
export async function checkCapability(
  cap: Capacidad,
): Promise<{ ok: boolean; empleado: Empleado | null }> {
  const emp = await getCurrentEmpleado();
  if (!emp) return { ok: false, empleado: null };
  if (!can(emp.rol, cap)) {
    await logDenegado(cap);
    return { ok: false, empleado: emp };
  }
  return { ok: true, empleado: emp };
}
