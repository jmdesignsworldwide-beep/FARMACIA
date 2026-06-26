import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Cliente, ClienteBasico } from "./clientes-shared";

export * from "./clientes-shared";

export async function getClientes(q?: string): Promise<Cliente[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  let query = supabase.from("clientes").select("*").order("nombre", { ascending: true }).limit(150);
  if (q) {
    const s = q.replace(/[%,]/g, " ").trim();
    query = query.or(`nombre.ilike.%${s}%,cedula.ilike.%${s}%,telefono.ilike.%${s}%`);
  }
  const { data } = await query;
  return (data ?? []) as Cliente[];
}

export async function getClientesBasico(): Promise<ClienteBasico[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase.from("clientes").select("id, nombre, cedula, alergias").order("nombre");
  return (data ?? []) as ClienteBasico[];
}

export async function getCliente(id: string): Promise<Cliente | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  return (data as Cliente) ?? null;
}

export type CompraResumen = {
  id: string;
  folio: number;
  total: number;
  metodo_pago: string;
  estado: string;
  created_at: string;
};

/** Historial de compras del cliente (ventas reales asociadas). */
export async function getClienteCompras(clienteId: string): Promise<CompraResumen[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("ventas")
    .select("id, folio, total, metodo_pago, estado, created_at")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CompraResumen[];
}

export type RecetaCliente = { id: string; numero: string; medico_nombre: string; fecha: string; controlada: boolean };

/** Recetas asociadas al cliente (por cédula o nombre del paciente). */
export async function getClienteRecetas(cliente: Cliente): Promise<RecetaCliente[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const filtros: string[] = [`paciente_nombre.eq.${cliente.nombre}`];
  if (cliente.cedula) filtros.push(`paciente_cedula.eq.${cliente.cedula}`);
  const { data } = await supabase
    .from("recetas")
    .select("id, numero, medico_nombre, fecha, controlada")
    .or(filtros.join(","))
    .order("fecha", { ascending: false });
  return (data ?? []) as RecetaCliente[];
}
