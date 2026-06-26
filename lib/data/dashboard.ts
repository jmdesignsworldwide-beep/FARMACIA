import "server-only";
import {
  getProductos,
  getLotesPorVencer,
  type ProductoConStock,
  type LoteConProducto,
} from "./inventory";

/**
 * Fuente del dashboard. Desde la Tanda 3, "por vencer" y "bajo stock"
 * leen de datos REALES (inventario en Supabase). Ventas y caja siguen
 * siendo demo hasta que el POS (Tanda 4) genere transacciones.
 */

export type AttentionItem = {
  id: string;
  kind: "expiry" | "stock";
  title: string;
  detail: string;
  tone: "danger" | "warning";
  href: string;
};

export type DashboardData = {
  salesToday: { amount: number; transactions: number };
  cashOnHand: { amount: number };
  expiring: { within30: number; within60: number; within90: number };
  lowStock: { count: number };
  attention: AttentionItem[];
  daySummary: {
    topPaymentMethod: { label: string; pct: number };
    topProduct: { name: string; units: number };
    ticketAverage: number;
  };
};

function buildAttention(
  lotes: LoteConProducto[],
  bajoStock: ProductoConStock[],
): AttentionItem[] {
  const fromExpiry: AttentionItem[] = lotes
    .filter((l) => l.dias_para_vencer <= 30)
    .map((l) => ({
      id: `exp-${l.id}`,
      kind: "expiry" as const,
      title: `${l.productos?.nombre_generico ?? "Producto"} ${
        l.productos?.presentacion ?? ""
      }`.trim(),
      detail: `Vence en ${l.dias_para_vencer} días · lote ${l.numero_lote} · ${l.cantidad} uds`,
      tone: l.dias_para_vencer <= 15 ? ("danger" as const) : ("warning" as const),
      href: `/inventario/${l.producto_id}`,
    }));

  const fromStock: AttentionItem[] = bajoStock.map((p) => ({
    id: `stk-${p.id}`,
    kind: "stock" as const,
    title: `${p.nombre_generico} ${p.concentracion ?? ""}`.trim(),
    detail: `Bajo stock: ${p.stock_total} de ${p.stock_minimo} mínimo`,
    tone: p.stock_total <= p.stock_minimo / 3 ? ("danger" as const) : ("warning" as const),
    href: `/inventario/${p.id}`,
  }));

  return [...fromExpiry, ...fromStock]
    .sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "danger" ? -1 : 1))
    .slice(0, 5);
}

export async function getDashboardData(): Promise<DashboardData> {
  const [productos, lotes] = await Promise.all([
    getProductos(),
    getLotesPorVencer(90),
  ]);

  const bajoStock = productos.filter((p) => p.bajo_stock);
  const within30 = lotes.filter((l) => l.dias_para_vencer <= 30).length;
  const within60 = lotes.filter((l) => l.dias_para_vencer <= 60).length;
  const within90 = lotes.length;

  return {
    // Demo hasta el POS (Tanda 4):
    salesToday: { amount: 48750.0, transactions: 213 },
    cashOnHand: { amount: 32480.0 },
    daySummary: {
      topPaymentMethod: { label: "Efectivo", pct: 58 },
      topProduct: { name: "Acetaminofén 500 mg", units: 47 },
      ticketAverage: 228.87,
    },
    // Datos REALES de inventario:
    expiring: { within30, within60, within90 },
    lowStock: { count: bajoStock.length },
    attention: buildAttention(lotes, bajoStock),
  };
}
