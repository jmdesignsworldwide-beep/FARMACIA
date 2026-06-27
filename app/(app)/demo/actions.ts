"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { isAdminDemo, getDemoAcceso } from "@/lib/data/demo-acceso";
import { usernameToEmail } from "@/lib/utils";

export type FormState = { error?: string; ok?: boolean };

async function logActividad(tipo: string, desc: string, detalle: Record<string, unknown>, refId?: string) {
  const supabase = createClient();
  await supabase.rpc("registrar_actividad", {
    p_tipo: tipo,
    p_desc: desc,
    p_detalle: detalle,
    p_ref_tabla: "demo_accesos",
    p_ref_id: refId ?? null,
  });
}

/** Calcula la fecha de vencimiento (ISO) sumando `dias` a partir de `base`. */
function venceEn(dias: number, base: Date = new Date()): string {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

/** Resuelve la vigencia elegida en { dias, venceAt }. */
function resolverVigencia(vigencia: string, diasCustom: number): { dias: number | null; venceAt: string | null } | null {
  if (vigencia === "none") return { dias: null, venceAt: null };
  if (vigencia === "custom") {
    if (!Number.isFinite(diasCustom) || diasCustom < 1 || diasCustom > 3650) return null;
    return { dias: diasCustom, venceAt: venceEn(diasCustom) };
  }
  const dias = Number(vigencia);
  if (![7, 15, 30].includes(dias)) return null;
  return { dias, venceAt: venceEn(dias) };
}

export async function crearCuentaDemo(_prev: FormState, formData: FormData): Promise<FormState> {
  // ⚠️ Guard de Capa B en el SERVIDOR: solo el admin del demo (JM Designs).
  if (!(await isAdminDemo())) return { error: "Solo el administrador del demo puede crear cuentas." };
  if (!isAdminConfigured())
    return { error: "Falta configurar la llave de servidor (SUPABASE_SERVICE_ROLE_KEY) en Vercel." };

  const s = (k: string) => String(formData.get(k) ?? "").trim();
  const username = s("username").toLowerCase();
  const password = s("password");
  const full_name = s("full_name") || null;
  const notas = s("notas") || null;
  const vigencia = s("vigencia") || "7";
  const diasCustom = Number(s("dias_custom") || "0");

  if (!username || !/^[a-z0-9._-]{3,}$/.test(username))
    return { error: "Usuario inválido (mínimo 3, solo letras, números, . _ -)." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

  const v = resolverVigencia(vigencia, diasCustom);
  if (!v) return { error: "Vigencia inválida. Revisa los días." };

  const admin = createAdminClient();
  // La cuenta de cliente explora la farmacia completa (rol interno 'dueno', Capa A),
  // pero NUNCA es admin del demo (Capa B): es_admin_demo se fija en false abajo.
  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username, full_name, rol: "dueno" },
  });
  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes("already"))
      return { error: "Ya existe una cuenta con ese usuario." };
    return { error: "No se pudo crear la cuenta." };
  }

  const { error: insErr } = await admin.from("demo_accesos").insert({
    user_id: data.user.id,
    username,
    es_admin_demo: false, // anti-escalada: una cuenta de cliente jamás nace admin
    vence_at: v.venceAt,
    dias_otorgados: v.dias,
    activo: true,
    notas,
  });
  if (insErr) {
    // Limpia el usuario auth si no se pudo registrar el acceso (no dejar huérfanos).
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "No se pudo registrar el acceso de la cuenta." };
  }

  await logActividad(
    "cuenta_demo_creada",
    `Cuenta de demo creada: ${username}` + (v.dias ? ` (${v.dias} días)` : " (sin vencimiento)"),
    { usuario: username, dias: v.dias, vence_at: v.venceAt },
    data.user.id,
  );

  revalidatePath("/demo");
  return { ok: true };
}

export async function renovarCuentaDemo(id: string, dias: number): Promise<FormState> {
  if (!(await isAdminDemo())) return { error: "Solo el administrador del demo puede renovar cuentas." };
  if (!isAdminConfigured()) return { error: "Falta la llave de servidor." };
  if (![7, 15, 30].includes(dias)) return { error: "Cantidad de días inválida." };

  const acceso = await getDemoAcceso(id);
  if (!acceso) return { error: "Cuenta no encontrada." };

  // Suma días: parte de la fecha futura existente o de hoy.
  const ahora = new Date();
  const baseStr = acceso.vence_at && new Date(acceso.vence_at) > ahora ? acceso.vence_at : ahora.toISOString();
  const venceAt = venceEn(dias, new Date(baseStr));

  const admin = createAdminClient();
  const { error } = await admin
    .from("demo_accesos")
    .update({ vence_at: venceAt, activo: true })
    .eq("id", id);
  if (error) return { error: "No se pudo renovar la cuenta." };

  await logActividad("cuenta_demo_renovada", `Cuenta de demo renovada: ${acceso.username} (+${dias} días)`,
    { usuario: acceso.username, dias, vence_at: venceAt }, acceso.user_id);

  revalidatePath("/demo");
  return { ok: true };
}

export async function toggleCuentaDemo(id: string, activo: boolean): Promise<FormState> {
  if (!(await isAdminDemo())) return { error: "Solo el administrador del demo puede cambiar cuentas." };
  if (!isAdminConfigured()) return { error: "Falta la llave de servidor." };

  const acceso = await getDemoAcceso(id);
  if (!acceso) return { error: "Cuenta no encontrada." };

  const admin = createAdminClient();
  const { error } = await admin.from("demo_accesos").update({ activo }).eq("id", id);
  if (error) return { error: "No se pudo actualizar la cuenta." };

  await logActividad(activo ? "cuenta_demo_activada" : "cuenta_demo_desactivada",
    `Cuenta de demo ${activo ? "activada" : "desactivada"}: ${acceso.username}`,
    { usuario: acceso.username, activo }, acceso.user_id);

  revalidatePath("/demo");
  return { ok: true };
}
