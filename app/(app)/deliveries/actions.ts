"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkCapability } from "@/lib/auth/guard";
import { getCurrentEmpleado } from "@/lib/data/empleados";
import { can } from "@/lib/auth/roles";

export type FormState = { error?: string; ok?: boolean };

export async function crearDelivery(_prev: FormState, formData: FormData): Promise<FormState> {
  const { ok, empleado } = await checkCapability("gestionar_deliveries");
  if (!ok || !empleado) return { error: "No tienes permiso para crear deliveries." };

  const s = (k: string) => String(formData.get(k) ?? "").trim();
  const cliente_id = s("cliente_id") || null;
  const cliente_nombre = s("cliente_nombre");
  const direccion = s("direccion");
  const motorista_id = s("motorista_id") || null;
  if (!cliente_nombre) return { error: "El cliente es obligatorio." };
  if (!direccion) return { error: "La dirección es obligatoria." };

  // Nombre del motorista (snapshot) si se asignó.
  let motorista_nombre: string | null = null;
  if (motorista_id) motorista_nombre = s("motorista_nombre") || null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("deliveries")
    .insert({
      cliente_id,
      cliente_nombre,
      telefono: s("telefono") || null,
      direccion,
      sector: s("sector") || null,
      detalle: s("detalle") || null,
      monto: Number(formData.get("monto")) || 0,
      metodo_pago: s("metodo_pago") || null,
      motorista_id,
      motorista_nombre,
      estado: "pendiente",
      notas: s("notas") || null,
      empleado_id: empleado.id,
      empleado_nombre: empleado.full_name ?? empleado.username,
    })
    .select("id, folio")
    .single();
  if (error || !data) return { error: "No se pudo crear el delivery." };

  await supabase.rpc("registrar_actividad", {
    p_tipo: "delivery_creado",
    p_desc: `Delivery #${data.folio} para ${cliente_nombre}`,
    p_detalle: { cliente: cliente_nombre, direccion, motorista: motorista_nombre },
    p_ref_tabla: "deliveries",
    p_ref_id: data.id,
  });

  revalidatePath("/deliveries");
  redirect(`/deliveries/${data.id}`);
}

/** Cambia el estado. Permitido a gestores o al motorista asignado. */
export async function cambiarEstadoDelivery(_prev: FormState, formData: FormData): Promise<FormState> {
  const empleado = await getCurrentEmpleado();
  if (!empleado) return { error: "Sesión expirada." };
  const id = String(formData.get("delivery_id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  if (!["pendiente", "en_camino", "entregado", "cancelado"].includes(estado))
    return { error: "Estado no válido." };

  const supabase = createClient();
  const { data: del } = await supabase.from("deliveries").select("motorista_id, folio").eq("id", id).maybeSingle();
  if (!del) return { error: "Delivery no encontrado." };

  const esGestor = can(empleado.rol, "gestionar_deliveries");
  const esSuMotorista = empleado.rol === "motorista" && del.motorista_id === empleado.id;
  if (!esGestor && !esSuMotorista) return { error: "No puedes actualizar este delivery." };

  const patch: Record<string, unknown> = { estado };
  if (estado === "entregado") patch.entregado_at = new Date().toISOString();
  const { error } = await supabase.from("deliveries").update(patch).eq("id", id);
  if (error) return { error: "No se pudo actualizar el estado." };

  await supabase.rpc("registrar_actividad", {
    p_tipo: "delivery_estado",
    p_desc: `Delivery #${del.folio} → ${estado.replace("_", " ")}`,
    p_detalle: { estado },
    p_ref_tabla: "deliveries",
    p_ref_id: id,
  });

  revalidatePath("/deliveries");
  revalidatePath(`/deliveries/${id}`);
  return { ok: true };
}
