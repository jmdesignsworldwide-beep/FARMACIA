"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { getCurrentEmpleado } from "@/lib/data/empleados";
import { can } from "@/lib/auth/roles";
import { formatRD } from "@/lib/utils";
import { TIPO_LABEL, type SearchGrupo, type SearchItem } from "@/lib/data/busqueda-shared";

const LIMIT = 5;

/**
 * Búsqueda global. Cada categoría se incluye SOLO si el rol del usuario tiene
 * la capacidad correspondiente (validado en el servidor) — un cajero no
 * encuentra inventario, ventas, empleados ni proveedores.
 */
export async function buscarGlobal(qRaw: string): Promise<SearchGrupo[]> {
  const q = (qRaw ?? "").trim();
  if (q.length < 2) return [];
  const emp = await getCurrentEmpleado();
  if (!emp) return [];
  const rol = emp.rol;
  const supabase = createClient();
  const like = q.replace(/[%,]/g, " ");
  const grupos: SearchGrupo[] = [];

  if (can(rol, "ver_inventario")) {
    const { data } = await supabase.from("productos")
      .select("id, nombre_comercial, nombre_generico, concentracion, codigo_barras")
      .eq("activo", true)
      .or(`nombre_comercial.ilike.%${like}%,nombre_generico.ilike.%${like}%,codigo_barras.ilike.%${like}%`)
      .limit(LIMIT);
    const items: SearchItem[] = (data ?? []).map((p: any) => ({
      id: p.id, titulo: p.nombre_comercial,
      sub: [p.nombre_generico, p.concentracion].filter(Boolean).join(" · "),
      href: `/inventario/${p.id}`,
    }));
    if (items.length) grupos.push({ tipo: "producto", label: TIPO_LABEL.producto, items });
  }

  if (can(rol, "ver_clientes")) {
    const { data } = await supabase.from("clientes")
      .select("id, nombre, cedula, telefono")
      .or(`nombre.ilike.%${like}%,cedula.ilike.%${like}%`)
      .limit(LIMIT);
    const items: SearchItem[] = (data ?? []).map((c: any) => ({
      id: c.id, titulo: c.nombre,
      sub: [c.cedula, c.telefono].filter(Boolean).join(" · ") || "Cliente",
      href: `/clientes/${c.id}`,
    }));
    if (items.length) grupos.push({ tipo: "cliente", label: TIPO_LABEL.cliente, items });
  }

  if (can(rol, "ver_ventas_todas")) {
    let query = supabase.from("ventas")
      .select("id, folio, total, cliente_nombre, created_at")
      .order("created_at", { ascending: false }).limit(LIMIT);
    query = /^\d+$/.test(q) ? query.eq("folio", Number(q)) : query.ilike("cliente_nombre", `%${like}%`);
    const { data } = await query;
    const items: SearchItem[] = (data ?? []).map((v: any) => ({
      id: v.id, titulo: `Venta #${v.folio}`,
      sub: [formatRD(Number(v.total)), v.cliente_nombre].filter(Boolean).join(" · "),
      href: `/ventas/historial/${v.id}`,
    }));
    if (items.length) grupos.push({ tipo: "venta", label: TIPO_LABEL.venta, items });
  }

  if (can(rol, "ver_empleados") && isAdminConfigured()) {
    const admin = createAdminClient();
    const { data } = await admin.from("profiles")
      .select("id, full_name, username")
      .or(`full_name.ilike.%${like}%,username.ilike.%${like}%`)
      .limit(LIMIT);
    const items: SearchItem[] = (data ?? []).map((e: any) => ({
      id: e.id, titulo: e.full_name ?? e.username,
      sub: `@${e.username}`,
      href: `/empleados/${e.id}`,
    }));
    if (items.length) grupos.push({ tipo: "empleado", label: TIPO_LABEL.empleado, items });
  }

  if (can(rol, "ver_proveedores")) {
    const { data } = await supabase.from("proveedores")
      .select("id, nombre, telefono, rnc")
      .or(`nombre.ilike.%${like}%,rnc.ilike.%${like}%`)
      .limit(LIMIT);
    const items: SearchItem[] = (data ?? []).map((p: any) => ({
      id: p.id, titulo: p.nombre,
      sub: [p.rnc, p.telefono].filter(Boolean).join(" · ") || "Proveedor",
      href: `/proveedores/${p.id}`,
    }));
    if (items.length) grupos.push({ tipo: "proveedor", label: TIPO_LABEL.proveedor, items });
  }

  return grupos;
}
