"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkCapability } from "@/lib/auth/guard";

export type FormState = { error?: string; ok?: boolean };

async function guardar(patch: Record<string, unknown>): Promise<{ error?: string }> {
  const { ok, empleado } = await checkCapability("gestionar_config");
  if (!ok || !empleado) return { error: "No tienes permiso para cambiar la configuración." };
  const supabase = createClient();
  const { error } = await supabase
    .from("configuracion")
    .update({ ...patch, updated_at: new Date().toISOString(), updated_by: empleado.full_name ?? empleado.username })
    .eq("id", 1);
  if (error) return { error: "No se pudo guardar." };
  return {};
}

/** Datos de la farmacia (el nombre se refleja en el header). */
export async function guardarDatosFarmacia(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = (k: string) => String(formData.get(k) ?? "").trim();
  const nombre = s("nombre_farmacia");
  if (!nombre) return { error: "El nombre de la farmacia es obligatorio." };
  const r = await guardar({
    nombre_farmacia: nombre,
    rnc: s("rnc") || null,
    direccion: s("direccion") || null,
    telefono: s("telefono") || null,
    logo_url: s("logo_url") || null,
  });
  if (r.error) return r;
  revalidatePath("/", "layout"); // refresca el header con el nuevo nombre
  return { ok: true };
}

/** Alertas: el sistema obedece estos umbrales. */
export async function guardarAlertas(_prev: FormState, formData: FormData): Promise<FormState> {
  const stock = Math.trunc(Number(formData.get("stock_minimo_default")));
  const dias = Math.trunc(Number(formData.get("dias_alerta_vencimiento")));
  if (!Number.isFinite(stock) || stock < 0) return { error: "Stock mínimo no válido." };
  if (!Number.isFinite(dias) || dias < 1 || dias > 365) return { error: "Días de alerta deben estar entre 1 y 365." };
  const r = await guardar({ stock_minimo_default: stock, dias_alerta_vencimiento: dias });
  if (r.error) return r;
  revalidatePath("/dashboard");
  revalidatePath("/inventario");
  revalidatePath("/inventario/alertas");
  return { ok: true };
}

/** Métodos de pago activos (navegable). */
export async function guardarMetodos(_prev: FormState, formData: FormData): Promise<FormState> {
  const metodos = {
    efectivo: formData.get("efectivo") === "on",
    transferencia: formData.get("transferencia") === "on",
    tarjeta_debito: formData.get("tarjeta_debito") === "on",
    tarjeta_credito: formData.get("tarjeta_credito") === "on",
  };
  const r = await guardar({ metodos_pago: metodos });
  if (r.error) return r;
  return { ok: true };
}

/** Cambio de contraseña del usuario actual (real). */
export async function cambiarPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };
  const pass = String(formData.get("password") ?? "");
  const conf = String(formData.get("confirmar") ?? "");
  if (pass.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (pass !== conf) return { error: "Las contraseñas no coinciden." };
  const { error } = await supabase.auth.updateUser({ password: pass });
  if (error) return { error: "No se pudo cambiar la contraseña." };
  return { ok: true };
}
