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
