"use server";

import { revalidatePath } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
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

/**
 * Cambia el USUARIO y/o la CONTRASEÑA de la cuenta admin del demo (real).
 * Anti-escalada: solo el admin del demo, validado en el servidor. Pide la
 * contraseña actual como confirmación. La nueva se guarda hasheada (Supabase Auth).
 */
export async function actualizarCredencialesAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdminDemo())) return { error: "Solo el administrador del demo puede cambiar estas credenciales." };
  if (!isAdminConfigured()) return { error: "Falta configurar la llave de servidor (SUPABASE_SERVICE_ROLE_KEY) en Vercel." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Sesión expirada. Vuelve a entrar." };

  const actual = String(formData.get("actual") ?? "");
  const nuevoUsuario = String(formData.get("nuevo_usuario") ?? "").trim().toLowerCase();
  const nuevaPass = String(formData.get("nueva_password") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  const cambiaUsuario = nuevoUsuario.length > 0;
  const cambiaPass = nuevaPass.length > 0;
  if (!cambiaUsuario && !cambiaPass) return { error: "No indicaste ningún cambio." };
  if (!actual) return { error: "Escribe tu contraseña actual para confirmar." };

  // Verifica la contraseña actual con un cliente efímero (no toca la sesión activa).
  const verif = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: verr } = await verif.auth.signInWithPassword({ email: user.email, password: actual });
  if (verr) return { error: "La contraseña actual no es correcta." };

  if (cambiaUsuario && !/^[a-z0-9._-]{3,}$/.test(nuevoUsuario))
    return { error: "Usuario inválido (mínimo 3, solo letras, números, . _ -)." };
  if (cambiaPass) {
    if (nuevaPass.length < 6) return { error: "La contraseña nueva debe tener al menos 6 caracteres." };
    if (nuevaPass !== confirmar) return { error: "La contraseña nueva y su confirmación no coinciden." };
  }

  const admin = createAdminClient();
  const updates: { email?: string; password?: string; email_confirm?: boolean; user_metadata?: Record<string, unknown> } = {};

  if (cambiaUsuario) {
    // Anti-duplicado: ¿ya existe otra cuenta con ese usuario?
    const { data: existing } = await admin.from("profiles").select("id").eq("username", nuevoUsuario).maybeSingle();
    if (existing && existing.id !== user.id) return { error: "Ya existe una cuenta con ese usuario." };
    updates.email = usernameToEmail(nuevoUsuario);
    updates.email_confirm = true;
    updates.user_metadata = { username: nuevoUsuario };
  }
  if (cambiaPass) updates.password = nuevaPass;

  const { error: upErr } = await admin.auth.admin.updateUserById(user.id, updates);
  if (upErr) {
    if (/already|registered|exists/i.test(upErr.message ?? "")) return { error: "Ya existe una cuenta con ese usuario." };
    return { error: "No se pudo actualizar las credenciales." };
  }

  if (cambiaUsuario) {
    // La auth no dispara triggers en update: refleja el usuario en profiles y demo_accesos.
    await admin.from("profiles").update({ username: nuevoUsuario }).eq("id", user.id);
    await admin.from("demo_accesos").update({ username: nuevoUsuario }).eq("user_id", user.id);
  }

  await logActividad(
    "admin_credenciales",
    `Credenciales de admin actualizadas${cambiaUsuario ? ` · usuario → ${nuevoUsuario}` : ""}${cambiaPass ? " · contraseña" : ""}`,
    { cambia_usuario: cambiaUsuario, cambia_password: cambiaPass },
    user.id,
  );

  revalidatePath("/demo");
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Elimina una cuenta de CLIENTE de forma real y limpia.
 * Protecciones: solo el admin del demo (servidor); la cuenta admin NUNCA se
 * elimina (aquí y por trigger en la base). Borrar la cuenta de auth elimina en
 * cascada su perfil y su acceso de demo; las referencias operativas quedan en
 * NULL — el historial inviolable de la farmacia NO se borra.
 */
export async function eliminarCuentaDemo(id: string): Promise<FormState> {
  if (!(await isAdminDemo())) return { error: "Solo el administrador del demo puede eliminar cuentas." };
  if (!isAdminConfigured()) return { error: "Falta la llave de servidor." };

  const acceso = await getDemoAcceso(id);
  if (!acceso) return { error: "Cuenta no encontrada." };
  // Protección no negociable: el admin del demo jamás se elimina.
  if (acceso.es_admin_demo) return { error: "La cuenta de administrador no se puede eliminar." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(acceso.user_id);
  if (error) return { error: "No se pudo eliminar la cuenta." };

  await logActividad("cuenta_demo_eliminada", `Cuenta de demo eliminada: ${acceso.username}`, { usuario: acceso.username });

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
