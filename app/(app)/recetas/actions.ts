"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkCapability } from "@/lib/auth/guard";

export type FormState = { error?: string; ok?: boolean };

type ItemPayload = {
  producto_id: string | null;
  nombre_medicamento: string;
  cantidad: number;
  indicaciones?: string;
  controlado: boolean;
};

export async function crearReceta(_prev: FormState, formData: FormData): Promise<FormState> {
  const { ok, empleado } = await checkCapability("gestionar_recetas");
  if (!ok || !empleado) return { error: "No tienes permiso para registrar recetas." };

  const s = (k: string) => String(formData.get(k) ?? "").trim();
  const numero = s("numero");
  const medico_nombre = s("medico_nombre");
  const paciente_nombre = s("paciente_nombre");
  const fecha = s("fecha") || new Date().toISOString().slice(0, 10);

  let items: ItemPayload[] = [];
  try {
    items = JSON.parse(s("items") || "[]");
  } catch {
    return { error: "Los medicamentos no son válidos." };
  }

  if (!medico_nombre) return { error: "El médico es obligatorio." };
  if (!paciente_nombre) return { error: "El paciente es obligatorio." };
  if (items.length === 0) return { error: "Agrega al menos un medicamento." };

  const controlada = items.some((i) => i.controlado);
  const supabase = createClient();

  const { data: receta, error } = await supabase
    .from("recetas")
    .insert({
      numero: numero || "S/N",
      medico_nombre,
      medico_colegiatura: s("medico_colegiatura") || null,
      paciente_nombre,
      paciente_cedula: s("paciente_cedula") || null,
      fecha,
      notas: s("notas") || null,
      controlada,
      origen: "manual",
      estado: "registrada",
      foto_url: s("foto_url") || null,
      empleado_id: empleado.id,
      empleado_nombre: empleado.full_name ?? empleado.username,
    })
    .select("id")
    .single();

  if (error || !receta) return { error: "No se pudo registrar la receta." };

  const itemsRows = items.map((i) => ({
    receta_id: receta.id,
    producto_id: i.producto_id,
    nombre_medicamento: i.nombre_medicamento,
    cantidad: Math.max(1, Math.trunc(i.cantidad) || 1),
    indicaciones: i.indicaciones || null,
    controlado: i.controlado,
  }));
  await supabase.from("receta_items").insert(itemsRows);

  await supabase.rpc("registrar_actividad", {
    p_tipo: "receta_registrada",
    p_desc: `Receta registrada #${numero || "S/N"} · ${paciente_nombre}`,
    p_detalle: { paciente: paciente_nombre, medico: medico_nombre, controlada },
    p_ref_tabla: "recetas",
    p_ref_id: receta.id,
  });

  revalidatePath("/recetas");
  redirect(`/recetas/${receta.id}`);
}
