import "server-only";
import {
  getProductos,
  getLotesPorVencer,
  type ProductoConStock,
  type LoteConProducto,
} from "./inventory";
import {
  getVentasHoy,
  getCajaActual,
  getCajaResumen,
  metodoLabel,
} from "./ventas";
import { getConfig } from "./config";

/**
 * Fuente del dashboard. Todo REAL desde la Tanda 4: ventas y caja leen
 * del POS; "por vencer" y "bajo stock" leen del inventario (Tanda 3).
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
  esDemo: boolean; // true si el flujo del día (ventas/caja) viene de muestra
  salesToday: { amount: number; transactions: number };
  cashOnHand: { amount: number };
  expiring: { within7: number; within30: number; within60: number; within90: number };
  lowStock: { count: number };
  attention: AttentionItem[];
  daySummary: {
    topPaymentMethod: { label: string; pct: number };
    topProduct: { name: string; units: number };
    ticketAverage: number;
  };
};

// Muestra creíble de un día activo (mismo criterio híbrido que Finanzas y
// Reportes): el panel se ve VIVO sin ventas reales, y al operar lee lo real.
const DEMO_DIA = {
  salesToday: { amount: 48600, transactions: 37 },
  cashOnHand: { amount: 32450 },
  daySummary: {
    topPaymentMethod: { label: "Efectivo", pct: 56 },
    topProduct: { name: "Acetaminofén 500 mg", units: 24 },
    ticketAverage: Math.round(48600 / 37),
  },
};

function buildAttention(
  lotes: LoteConProducto[],
  bajoStock: ProductoConStock[],
  ventana: number,
): AttentionItem[] {
  const fromExpiry: AttentionItem[] = lotes
    .filter((l) => l.dias_para_vencer <= ventana)
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
  const [productos, lotes, ventasHoy, caja, config] = await Promise.all([
    getProductos(),
    getLotesPorVencer(90),
    getVentasHoy(),
    getCajaActual(),
    getConfig(),
  ]);

  // El sistema obedece la configuración: umbral de stock y ventana de vencimiento.
  const bajoStock = productos.filter(
    (p) => p.stock_total <= Math.max(p.stock_minimo, config.stock_minimo_default),
  );
  const ventana = config.dias_alerta_vencimiento;
  const within7 = lotes.filter((l) => l.dias_para_vencer <= 7).length;
  const within30 = lotes.filter((l) => l.dias_para_vencer <= ventana).length;
  const within60 = lotes.filter((l) => l.dias_para_vencer <= 60).length;
  const within90 = lotes.length;

  // Caja del día: efectivo esperado en la caja abierta (0 si está cerrada).
  let cashOnHand = 0;
  if (caja) cashOnHand = (await getCajaResumen(caja)).efectivoEsperado;

  // Pago más usado hoy.
  const metodos = Object.entries(ventasHoy.porMetodo).sort((a, b) => b[1] - a[1]);
  const topPago = metodos[0];
  const topPaymentMethod = topPago
    ? { label: metodoLabel(topPago[0]), pct: Math.round((topPago[1] / ventasHoy.total) * 100) }
    : { label: "—", pct: 0 };

  // Híbrido: sin ventas reales hoy, el flujo del día usa muestra creíble
  // (el inventario —bajo stock / por vencer— SIEMPRE es real).
  const esDemo = ventasHoy.count === 0;

  return {
    esDemo,
    salesToday: esDemo ? DEMO_DIA.salesToday : { amount: ventasHoy.total, transactions: ventasHoy.count },
    cashOnHand: esDemo ? DEMO_DIA.cashOnHand : { amount: cashOnHand },
    daySummary: esDemo
      ? DEMO_DIA.daySummary
      : {
          topPaymentMethod,
          topProduct: ventasHoy.topProducto
            ? { name: ventasHoy.topProducto.nombre, units: ventasHoy.topProducto.unidades }
            : { name: "—", units: 0 },
          ticketAverage: ventasHoy.ticketPromedio,
        },
    expiring: { within7, within30, within60, within90 },
    lowStock: { count: bajoStock.length },
    attention: buildAttention(lotes, bajoStock, ventana),
  };
}
