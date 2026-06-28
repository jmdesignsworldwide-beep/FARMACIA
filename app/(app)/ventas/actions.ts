"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkCapability } from "@/lib/auth/guard";
import { getVentaDetalle, type VentaItem } from "@/lib/data/ventas";

export type FormState = { error?: string; ok?: boolean };

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  return { supabase, user };
}

function revalidarVentas() {
  revalidatePath("/ventas");
  revalidatePath("/ventas/historial");
  revalidatePath("/ventas/caja");
  revalidatePath("/inventario");
  revalidatePath("/dashboard");
}

export type CartItemPayload = {
  producto_id: string;
  cantidad: number; // cantidad mostrada (cajas o unidades)
  precio_unitario: number; // precio de esa presentación
  unidades?: number; // unidades REALES a descontar del stock (default = cantidad)
  presentacion?: string | null; // etiqueta "Caja (20 u.)" / "Unidad"
  descuento?: number;
};

export type VentaPayload = {
  items: CartItemPayload[];
  metodo: string;
  descuento?: number;
  montoRecibido?: number | null;
  voucher?: string | null;
  receta?: { medico?: string; paciente?: string; numero?: string } | null;
  clienteId?: string | null;
  clienteNombre?: string | null;
};

export type VentaResultado = {
  ok: boolean;
  error?: string;
  folio?: number;
  total?: number;
  cambio?: number;
  items?: VentaItem[];
};

/** Registra una venta: FEFO + movimientos + caja, todo atómico vía RPC. */
export async function registrarVenta(
  payload: VentaPayload,
): Promise<VentaResultado> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Sesión expirada. Vuelve a entrar." };
  if (!(await checkCapability("usar_pos")).ok)
    return { ok: false, error: "No tienes permiso para vender." };

  if (!payload.items?.length) return { ok: false, error: "El carrito está vacío." };

  const { data, error } = await supabase.rpc("registrar_venta", {
    p_items: payload.items.map((i) => ({
      producto_id: i.producto_id,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
      unidades: i.unidades ?? i.cantidad,
      presentacion: i.presentacion ?? null,
      descuento: i.descuento ?? 0,
    })),
    p_metodo: payload.metodo,
    p_descuento: payload.descuento ?? 0,
    p_monto_recibido: payload.montoRecibido ?? null,
    p_voucher: payload.voucher ?? null,
    p_receta: payload.receta ?? null,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("caja")) return { ok: false, error: "Debes abrir la caja antes de vender." };
    if (msg.includes("insuficiente")) return { ok: false, error: "Stock insuficiente para uno de los productos." };
    if (msg.includes("recibido")) return { ok: false, error: "El monto recibido es menor que el total." };
    return { ok: false, error: "No se pudo completar la venta." };
  }

  const res = data as { venta_id: string; folio: number; total: number; cambio: number };

  // Asociar el cliente a la venta (fuente única para su historial de compras).
  if (payload.clienteId) {
    await supabase
      .from("ventas")
      .update({ cliente_id: payload.clienteId, cliente_nombre: payload.clienteNombre ?? null })
      .eq("id", res.venta_id);
  }

  const detalle = await getVentaDetalle(res.venta_id);
  revalidarVentas();
  revalidatePath("/clientes");
  return {
    ok: true,
    folio: res.folio,
    total: Number(res.total),
    cambio: Number(res.cambio),
    items: detalle?.items ?? [],
  };
}

export async function abrirCaja(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesión expirada." };
  if (!(await checkCapability("usar_caja")).ok) return { error: "No tienes permiso para operar la caja." };
  const monto = Number(formData.get("monto_inicial"));
  if (!Number.isFinite(monto) || monto < 0)
    return { error: "El monto inicial no es válido." };

  const { error } = await supabase.rpc("abrir_caja", { p_monto_inicial: monto });
  if (error)
    return {
      error: error.message?.includes("abierta")
        ? "Ya hay una caja abierta."
        : "No se pudo abrir la caja.",
    };
  revalidarVentas();
  return { ok: true };
}

export async function registrarEgreso(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesión expirada." };
  if (!(await checkCapability("usar_caja")).ok) return { error: "No tienes permiso para operar la caja." };
  const caja_id = String(formData.get("caja_id") ?? "");
  const monto = Number(formData.get("monto"));
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (!caja_id) return { error: "No hay caja abierta." };
  if (!Number.isFinite(monto) || monto <= 0) return { error: "El monto debe ser mayor que cero." };
  if (!motivo) return { error: "El motivo es obligatorio." };

  const { error } = await supabase.from("caja_egresos").insert({
    caja_id,
    monto,
    motivo,
    registrado_por: user.id,
  });
  if (error) return { error: "No se pudo registrar el egreso." };
  revalidarVentas();
  return { ok: true };
}

export async function cerrarCaja(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesión expirada." };
  if (!(await checkCapability("usar_caja")).ok) return { error: "No tienes permiso para operar la caja." };
  const contado = Number(formData.get("monto_contado"));
  const notas = String(formData.get("notas") ?? "").trim() || null;
  if (!Number.isFinite(contado) || contado < 0)
    return { error: "El monto contado no es válido." };

  const { error } = await supabase.rpc("cerrar_caja", {
    p_monto_contado: contado,
    p_notas: notas,
  });
  if (error) return { error: "No se pudo cerrar la caja." };
  revalidarVentas();
  return { ok: true };
}

export async function anularVenta(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesión expirada." };
  if (!(await checkCapability("ver_ventas_todas")).ok) return { error: "No tienes permiso para anular ventas." };
  const venta_id = String(formData.get("venta_id") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (!venta_id) return { error: "Venta no válida." };
  if (!motivo) return { error: "El motivo de anulación es obligatorio." };

  const { error } = await supabase.rpc("anular_venta", {
    p_venta_id: venta_id,
    p_motivo: motivo,
  });
  if (error)
    return {
      error: error.message?.includes("anulada")
        ? "La venta ya está anulada."
        : "No se pudo anular la venta.",
    };
  revalidarVentas();
  revalidatePath(`/ventas/historial/${venta_id}`);
  return { ok: true };
}
