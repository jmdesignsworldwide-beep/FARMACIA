"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkCapability } from "@/lib/auth/guard";

export type FormState = { error?: string; ok?: boolean };

function parse(formData: FormData) {
  const s = (k: string) => String(formData.get(k) ?? "").trim();
  const alergias = s("alergias")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  return {
    nombre: s("nombre"),
    cedula: s("cedula") || null,
    telefono: s("telefono") || null,
    fecha_nacimiento: s("fecha_nacimiento") || null,
    alergias,
    notas: s("notas") || null,
    balance: Number(formData.get("balance")) || 0,
    frecuente: formData.get("frecuente") === "on",
  };
}

/** Crear cliente "al vuelo" desde un autocompletado (solo nombre). Valida rol en el servidor. */
export async function crearClienteRapido(nombre: string): Promise<{ ok: boolean; id?: string; nombre?: string; error?: string }> {
  const { ok, empleado } = await checkCapability("gestionar_clientes");
  if (!ok || !empleado) return { ok: false, error: "Sin permiso para registrar clientes." };
  const n = (nombre ?? "").trim();
  if (n.length < 2) return { ok: false, error: "Nombre muy corto." };
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({ nombre: n, alergias: [], balance: 0, empleado_id: empleado.id, empleado_nombre: empleado.full_name ?? empleado.username })
    .select("id, nombre")
    .single();
  if (error || !data) return { ok: false, error: "No se pudo crear el cliente." };
  await supabase.rpc("registrar_actividad", {
    p_tipo: "cliente_registrado", p_desc: `Cliente registrado: ${n}`,
    p_detalle: { cliente: n, via: "autocompletado" }, p_ref_tabla: "clientes", p_ref_id: data.id,
  });
  revalidatePath("/clientes");
  return { ok: true, id: data.id, nombre: data.nombre };
}

export async function crearCliente(_prev: FormState, formData: FormData): Promise<FormState> {
  const { ok, empleado } = await checkCapability("gestionar_clientes");
  if (!ok || !empleado) return { error: "No tienes permiso para registrar clientes." };
  const c = parse(formData);
  if (!c.nombre) return { error: "El nombre es obligatorio." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({ ...c, empleado_id: empleado.id, empleado_nombre: empleado.full_name ?? empleado.username })
    .select("id")
    .single();
  if (error || !data) return { error: "No se pudo registrar el cliente." };

  await supabase.rpc("registrar_actividad", {
    p_tipo: "cliente_registrado",
    p_desc: `Cliente registrado: ${c.nombre}`,
    p_detalle: { cliente: c.nombre, alergias: c.alergias },
    p_ref_tabla: "clientes",
    p_ref_id: data.id,
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function actualizarCliente(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { ok } = await checkCapability("gestionar_clientes");
  if (!ok) return { error: "No tienes permiso para editar clientes." };
  const c = parse(formData);
  if (!c.nombre) return { error: "El nombre es obligatorio." };

  const supabase = createClient();
  const { error } = await supabase.from("clientes").update(c).eq("id", id);
  if (error) return { error: "No se pudo actualizar el cliente." };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}
