/**
 * Fuente ÚNICA de datos del dashboard (sala de mando).
 *
 * Hoy devuelve datos de demostración (mock) con realismo dominicano.
 * Cuando existan los módulos reales (POS, Inventario, Caja), basta con
 * reemplazar el cuerpo de `getDashboardData()` por consultas a Supabase
 * manteniendo el MISMO tipo `DashboardData`. La UI no cambia.
 */

export type ExpiringProduct = {
  id: string;
  name: string; // nombre comercial
  generic: string; // genérico
  presentation: string;
  lot: string;
  daysToExpiry: number;
  units: number;
};

export type LowStockProduct = {
  id: string;
  name: string;
  generic: string;
  presentation: string;
  units: number;
  min: number;
};

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
  expiring: {
    items: ExpiringProduct[];
    within30: number;
    within60: number;
    within90: number;
  };
  lowStock: { items: LowStockProduct[]; count: number };
  attention: AttentionItem[];
  daySummary: {
    topPaymentMethod: { label: string; pct: number };
    topProduct: { name: string; units: number };
    ticketAverage: number;
  };
};

// ── Productos por vencer (lotes con realismo dominicano) ───────────────
const EXPIRING: ExpiringProduct[] = [
  { id: "ex-1", name: "Amoxil", generic: "Amoxicilina", presentation: "500 mg · cápsulas", lot: "A-2291", daysToExpiry: 12, units: 34 },
  { id: "ex-2", name: "Cozaar", generic: "Losartán", presentation: "50 mg · tabletas", lot: "L-1187", daysToExpiry: 21, units: 18 },
  { id: "ex-3", name: "Losec", generic: "Omeprazol", presentation: "20 mg · cápsulas", lot: "O-5530", daysToExpiry: 28, units: 52 },
  { id: "ex-4", name: "Glucophage", generic: "Metformina", presentation: "850 mg · tabletas", lot: "M-3340", daysToExpiry: 44, units: 27 },
  { id: "ex-5", name: "Claritin", generic: "Loratadina", presentation: "10 mg · tabletas", lot: "C-0921", daysToExpiry: 51, units: 40 },
  { id: "ex-6", name: "Voltaren", generic: "Diclofenaco", presentation: "50 mg · tabletas", lot: "V-7782", daysToExpiry: 58, units: 22 },
  { id: "ex-7", name: "Lipitor", generic: "Atorvastatina", presentation: "20 mg · tabletas", lot: "T-4416", daysToExpiry: 73, units: 31 },
  { id: "ex-8", name: "Zitromax", generic: "Azitromicina", presentation: "500 mg · tabletas", lot: "Z-9015", daysToExpiry: 88, units: 15 },
];

// ── Productos bajo el mínimo ───────────────────────────────────────────
const LOW_STOCK: LowStockProduct[] = [
  { id: "ls-1", name: "Ventolin", generic: "Salbutamol", presentation: "inhalador 100 mcg", units: 3, min: 12 },
  { id: "ls-2", name: "Tylenol", generic: "Acetaminofén", presentation: "500 mg · tabletas", units: 8, min: 40 },
  { id: "ls-3", name: "Advil", generic: "Ibuprofeno", presentation: "400 mg · tabletas", units: 11, min: 30 },
  { id: "ls-4", name: "Vasotec", generic: "Enalapril", presentation: "10 mg · tabletas", units: 6, min: 20 },
  { id: "ls-5", name: "Benadryl", generic: "Difenhidramina", presentation: "jarabe 120 ml", units: 4, min: 15 },
];

/** Construye la lista "Necesita atención hoy" a partir de las mismas fuentes. */
function buildAttention(
  expiring: ExpiringProduct[],
  lowStock: LowStockProduct[],
): AttentionItem[] {
  const fromExpiry: AttentionItem[] = expiring
    .filter((p) => p.daysToExpiry <= 30)
    .map((p) => ({
      id: `att-${p.id}`,
      kind: "expiry" as const,
      title: `${p.generic} ${p.presentation.split(" · ")[0]}`,
      detail: `Vence en ${p.daysToExpiry} días · lote ${p.lot} · ${p.units} uds`,
      tone: p.daysToExpiry <= 15 ? ("danger" as const) : ("warning" as const),
      href: "/inventario",
    }));

  const fromStock: AttentionItem[] = lowStock.map((p) => ({
    id: `att-${p.id}`,
    kind: "stock" as const,
    title: `${p.generic} ${p.presentation.split(" · ")[0]}`,
    detail: `Bajo stock: ${p.units} de ${p.min} mínimo`,
    tone: p.units <= p.min / 3 ? ("danger" as const) : ("warning" as const),
    href: "/inventario",
  }));

  // Más urgente primero (danger antes que warning), máximo 5.
  return [...fromExpiry, ...fromStock]
    .sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "danger" ? -1 : 1))
    .slice(0, 5);
}

/**
 * Devuelve el estado actual del dashboard.
 * Async a propósito: cuando se conecte a Supabase, la firma no cambia.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const within30 = EXPIRING.filter((p) => p.daysToExpiry <= 30).length;
  const within60 = EXPIRING.filter((p) => p.daysToExpiry <= 60).length;
  const within90 = EXPIRING.filter((p) => p.daysToExpiry <= 90).length;

  return {
    salesToday: { amount: 48750.0, transactions: 213 },
    cashOnHand: { amount: 32480.0 },
    expiring: { items: EXPIRING, within30, within60, within90 },
    lowStock: { items: LOW_STOCK, count: LOW_STOCK.length },
    attention: buildAttention(EXPIRING, LOW_STOCK),
    daySummary: {
      topPaymentMethod: { label: "Efectivo", pct: 58 },
      topProduct: { name: "Acetaminofén 500 mg", units: 47 },
      ticketAverage: 228.87,
    },
  };
}
