"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkCapability } from "@/lib/auth/guard";

export type FormState = { error?: string; ok?: boolean };

function parse(formData: FormData) {
  const s = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    nombre: s("nombre"),
    tipo: s("tipo") || "distribuidor",
    telefono: s("telefono") || null,
    email: s("email") || null,
    rnc: s("rnc") || null,
    direccion: s("direccion") || null,
    notas: s("notas") || null,
  };
}

/** Crear proveedor "al vuelo" desde un autocompletado (solo nombre). Valida rol en el servidor. */
export async function crearProveedorRapido(nombre: string): Promise<{ ok: boolean; id?: string; nombre?: string; error?: string }> {
  const { ok, empleado } = await checkCapability("gestionar_proveedores");
  if (!ok || !empleado) return { ok: false, error: "Sin permiso para gestionar proveedores." };
  const n = (nombre ?? "").trim();
  if (n.length < 2) return { ok: false, error: "Nombre muy corto." };
  const supabase = createClient();
  const { data, error } = await supabase
    .from("proveedores")
    .insert({ nombre: n, tipo: "distribuidor", empleado_nombre: empleado.full_name ?? empleado.username })
    .select("id, nombre")
    .single();
  if (error || !data) return { ok: false, error: "No se pudo crear el proveedor." };
  await supabase.rpc("registrar_actividad", {
    p_tipo: "proveedor_registrado", p_desc: `Proveedor registrado: ${n}`,
    p_detalle: { proveedor: n, via: "autocompletado" }, p_ref_tabla: "proveedores", p_ref_id: data.id,
  });
  revalidatePath("/proveedores");
  return { ok: true, id: data.id, nombre: data.nombre };
}

export async function crearProveedor(_prev: FormState, formData: FormData): Promise<FormState> {
  const { ok, empleado } = await checkCapability("gestionar_proveedores");
  if (!ok || !empleado) return { error: "No tienes permiso para gestionar proveedores." };
  const p = parse(formData);
  if (!p.nombre) return { error: "El nombre es obligatorio." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("proveedores")
    .insert({ ...p, empleado_nombre: empleado.full_name ?? empleado.username })
    .select("id")
    .single();
  if (error || !data) return { error: "No se pudo registrar el proveedor." };

  await supabase.rpc("registrar_actividad", {
    p_tipo: "proveedor_registrado",
    p_desc: `Proveedor registrado: ${p.nombre}`,
    p_detalle: { proveedor: p.nombre, tipo: p.tipo },
    p_ref_tabla: "proveedores",
    p_ref_id: data.id,
  });

  revalidatePath("/proveedores");
  redirect(`/proveedores/${data.id}`);
}

export async function actualizarProveedor(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { ok } = await checkCapability("gestionar_proveedores");
  if (!ok) return { error: "No tienes permiso para gestionar proveedores." };
  const p = parse(formData);
  if (!p.nombre) return { error: "El nombre es obligatorio." };

  const supabase = createClient();
  const { error } = await supabase.from("proveedores").update(p).eq("id", id);
  if (error) return { error: "No se pudo actualizar el proveedor." };

  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${id}`);
  redirect(`/proveedores/${id}`);
}
