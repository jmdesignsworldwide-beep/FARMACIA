"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkCapability } from "@/lib/auth/guard";

export type FormState = { error?: string; ok?: boolean };

const SIN_PERMISO = "No tienes permiso para modificar el inventario.";

/** Verifica sesión en el servidor (defensa en profundidad). */
async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function parseProducto(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string) => {
    const v = Number(formData.get(k));
    return Number.isFinite(v) ? v : NaN;
  };
  return {
    nombre_comercial: str("nombre_comercial"),
    nombre_generico: str("nombre_generico"),
    laboratorio: str("laboratorio") || null,
    concentracion: str("concentracion") || null,
    presentacion: str("presentacion") || null,
    categoria: str("categoria") || "Otros",
    codigo_barras: str("codigo_barras") || null,
    precio_costo: num("precio_costo"),
    precio_venta: num("precio_venta"),
    controlado: formData.get("controlado") === "on",
    requiere_receta: formData.get("requiere_receta") === "on",
    stock_minimo: Math.trunc(num("stock_minimo")),
    unidades_por_caja: Math.trunc(num("unidades_por_caja")) || 1,
    vende_caja: formData.get("vende_caja") === "on",
    precio_caja: num("precio_caja") || 0,
    vende_unidad: formData.get("vende_unidad") === "on",
  };
}

function validar(p: ReturnType<typeof parseProducto>): string | null {
  if (!p.nombre_comercial) return "El nombre comercial es obligatorio.";
  if (!p.nombre_generico) return "El nombre genérico es obligatorio.";
  if (!Number.isFinite(p.precio_costo) || p.precio_costo < 0)
    return "El precio de costo no es válido.";
  if (!Number.isFinite(p.precio_venta) || p.precio_venta < 0)
    return "El precio de venta no es válido.";
  if (!Number.isFinite(p.stock_minimo) || p.stock_minimo < 0)
    return "El stock mínimo no es válido.";
  // Presentación: al menos una forma de venta activa y precios coherentes.
  if (!p.vende_caja && !p.vende_unidad)
    return "Activa al menos una forma de venta: por caja o detallado.";
  if (!Number.isInteger(p.unidades_por_caja) || p.unidades_por_caja < 1)
    return "Las unidades por caja deben ser un número entero ≥ 1.";
  if (p.vende_caja && p.unidades_por_caja < 2)
    return "Si se vende por caja, define cuántas unidades trae la caja (≥ 2).";
  if (p.vende_caja && (!Number.isFinite(p.precio_caja) || p.precio_caja <= 0))
    return "Indica el precio por caja.";
  if (p.vende_unidad && p.precio_venta <= 0)
    return "Indica el precio por unidad (precio de venta).";
  return null;
}

export async function crearProducto(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await checkCapability("editar_inventario")).ok) return { error: SIN_PERMISO };
  const { supabase } = await requireUser();
  const p = parseProducto(formData);
  const err = validar(p);
  if (err) return { error: err };

  const { data, error } = await supabase
    .from("productos")
    .insert(p)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return { error: "Ya existe un producto con ese código de barras." };
    return { error: "No se pudo guardar el producto." };
  }

  revalidatePath("/inventario");
  revalidatePath("/dashboard");
  redirect(`/inventario/${data.id}`);
}

export async function actualizarProducto(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await checkCapability("editar_inventario")).ok) return { error: SIN_PERMISO };
  const { supabase } = await requireUser();
  const p = parseProducto(formData);
  const err = validar(p);
  if (err) return { error: err };

  const { error } = await supabase.from("productos").update(p).eq("id", id);
  if (error) {
    if (error.code === "23505")
      return { error: "Ya existe un producto con ese código de barras." };
    return { error: "No se pudo actualizar el producto." };
  }

  revalidatePath("/inventario");
  revalidatePath(`/inventario/${id}`);
  revalidatePath("/dashboard");
  redirect(`/inventario/${id}`);
}

/** Entrada de mercancía: crea/suma lote y registra el movimiento (atómico vía RPC). */
export async function registrarEntrada(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await checkCapability("editar_inventario")).ok) return { error: SIN_PERMISO };
  const { supabase } = await requireUser();

  const producto_id = String(formData.get("producto_id") ?? "");
  const numero_lote = String(formData.get("numero_lote") ?? "").trim();
  const cantidad = Math.trunc(Number(formData.get("cantidad")));
  const vencimiento = String(formData.get("fecha_vencimiento") ?? "");
  const proveedor = String(formData.get("proveedor") ?? "").trim() || null;
  const proveedor_id = String(formData.get("proveedor_id") ?? "").trim() || null;
  const fecha_entrada =
    String(formData.get("fecha_entrada") ?? "").trim() || null;

  if (!producto_id) return { error: "Selecciona un producto." };
  if (!numero_lote) return { error: "El número de lote es obligatorio." };
  if (!Number.isFinite(cantidad) || cantidad <= 0)
    return { error: "La cantidad debe ser mayor que cero." };
  if (!vencimiento) return { error: "La fecha de vencimiento es obligatoria." };

  const { data: loteId, error } = await supabase.rpc("registrar_entrada_mercancia", {
    p_producto_id: producto_id,
    p_numero_lote: numero_lote,
    p_cantidad: cantidad,
    p_vencimiento: vencimiento,
    p_proveedor: proveedor,
    p_fecha_entrada: fecha_entrada,
  });

  if (error) return { error: "No se pudo registrar la entrada." };

  // Vincular el lote al proveedor registrado (fuente única).
  if (proveedor_id && loteId) {
    await supabase.from("lotes").update({ proveedor_id }).eq("id", loteId);
  }

  revalidatePath("/inventario");
  revalidatePath(`/inventario/${producto_id}`);
  revalidatePath("/inventario/movimientos");
  revalidatePath("/dashboard");
  redirect(`/inventario/${producto_id}`);
}

/** Ajuste de stock de un lote (atómico vía RPC). */
export async function registrarAjuste(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await checkCapability("editar_inventario")).ok) return { error: SIN_PERMISO };
  const { supabase } = await requireUser();

  const lote_id = String(formData.get("lote_id") ?? "");
  const producto_id = String(formData.get("producto_id") ?? "");
  const nueva_cantidad = Math.trunc(Number(formData.get("nueva_cantidad")));
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  if (!lote_id) return { error: "Lote no válido." };
  if (!Number.isFinite(nueva_cantidad) || nueva_cantidad < 0)
    return { error: "La cantidad no puede ser negativa." };

  const { error } = await supabase.rpc("registrar_ajuste_lote", {
    p_lote_id: lote_id,
    p_nueva_cantidad: nueva_cantidad,
    p_motivo: motivo,
  });

  if (error) return { error: "No se pudo registrar el ajuste." };

  revalidatePath("/inventario");
  if (producto_id) revalidatePath(`/inventario/${producto_id}`);
  revalidatePath("/inventario/movimientos");
  revalidatePath("/dashboard");
  return { ok: true };
}
