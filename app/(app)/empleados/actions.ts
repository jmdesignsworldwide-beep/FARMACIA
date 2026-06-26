"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { checkCapability } from "@/lib/auth/guard";
import { usernameToEmail } from "@/lib/utils";
import { ROLES } from "@/lib/auth/roles";

export type FormState = { error?: string; ok?: boolean };

const ROLES_VALIDOS = ROLES.map((r) => r.value);

async function logActividad(tipo: string, desc: string, detalle: Record<string, unknown>, refId?: string) {
  const supabase = createClient();
  await supabase.rpc("registrar_actividad", {
    p_tipo: tipo,
    p_desc: desc,
    p_detalle: detalle,
    p_ref_tabla: "profiles",
    p_ref_id: refId ?? null,
  });
}

function parse(formData: FormData) {
  const s = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    full_name: s("full_name"),
    cedula: s("cedula") || null,
    telefono: s("telefono") || null,
    cargo: s("cargo") || null,
    turno: s("turno") || null,
    rol: s("rol"),
    username: s("username").toLowerCase(),
    password: s("password"),
  };
}

export async function crearEmpleado(_prev: FormState, formData: FormData): Promise<FormState> {
  const { ok } = await checkCapability("gestionar_empleados");
  if (!ok) return { error: "No tienes permiso para gestionar empleados." };
  if (!isAdminConfigured())
    return { error: "Falta configurar la llave de servidor (SUPABASE_SERVICE_ROLE_KEY) en Vercel." };

  const p = parse(formData);
  if (!p.full_name) return { error: "El nombre es obligatorio." };
  if (!p.username || !/^[a-z0-9._-]{3,}$/.test(p.username))
    return { error: "Usuario inválido (mínimo 3, solo letras, números, . _ -)." };
  if (p.password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (!ROLES_VALIDOS.includes(p.rol as any)) return { error: "Selecciona un rol válido." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(p.username),
    password: p.password,
    email_confirm: true,
    user_metadata: {
      username: p.username,
      full_name: p.full_name,
      rol: p.rol,
      cedula: p.cedula,
      telefono: p.telefono,
      cargo: p.cargo,
      turno: p.turno,
    },
  });

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes("already"))
      return { error: "Ya existe un empleado con ese usuario." };
    return { error: "No se pudo crear el empleado." };
  }

  await logActividad("empleado_creado", `Empleado creado: ${p.full_name} (${p.rol})`, {
    empleado: p.full_name,
    usuario: p.username,
    rol: p.rol,
  }, data.user.id);

  revalidatePath("/empleados");
  redirect(`/empleados/${data.user.id}`);
}

export async function actualizarEmpleado(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { ok } = await checkCapability("gestionar_empleados");
  if (!ok) return { error: "No tienes permiso para gestionar empleados." };
  if (!isAdminConfigured())
    return { error: "Falta configurar la llave de servidor (SUPABASE_SERVICE_ROLE_KEY) en Vercel." };

  const p = parse(formData);
  if (!p.full_name) return { error: "El nombre es obligatorio." };
  if (!ROLES_VALIDOS.includes(p.rol as any)) return { error: "Selecciona un rol válido." };
  const activo = formData.get("activo") === "on";

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: p.full_name,
      cedula: p.cedula,
      telefono: p.telefono,
      cargo: p.cargo,
      turno: p.turno,
      rol: p.rol,
      activo,
    })
    .eq("id", id);

  if (error) return { error: "No se pudo actualizar el empleado." };

  await logActividad("empleado_editado", `Empleado actualizado: ${p.full_name}`, {
    empleado: p.full_name,
    rol: p.rol,
    activo,
  }, id);

  revalidatePath("/empleados");
  revalidatePath(`/empleados/${id}`);
  redirect(`/empleados/${id}`);
}
