// Panel financiero — tipos + datos de muestra creíbles (compartido cliente/servidor).
// El servidor lee REAL (ventas T4, costos/lotes T3, caja/egresos T4). El patrimonio
// (valor de inventario, plata en caja, capital dormido) SIEMPRE es real.
// Si aún no hay suficientes ventas reales, el FLUJO (entró/salió/ganancia) usa muestra.

export type FinanzasPeriodo = "dia" | "semana" | "mes" | "custom";

export type MetodoBreak = { metodo: string; monto: number; pct: number };
export type CategoriaGasto = { categoria: string; monto: number };
export type SerieFin = { label: string; ingresos: number; egresos: number };
export type ProductoRent = {
  productoId: string | null;
  nombre: string;
  margenPct: number;
  costo: number;
  venta: number;
};
export type VentaLinea = { id: string; folio: number; total: number; metodo: string; created_at: string };
export type GastoLinea = { motivo: string; monto: number; created_at: string };

/** Tendencia de un número clave vs el período anterior. `mejor` = el cambio es bueno. */
export type Tendencia = { pct: number; mejor: boolean };
export type Tendencias = { entro: Tendencia; salio: Tendencia; ganancia: Tendencia; margen: Tendencia };
export type Proyeccion = { ventas: number; ganancia: number; pctMes: number };
export type Insights = { patrimonio: string; rentable: string; salidas: string };

export type FinanzasData = {
  periodo: FinanzasPeriodo;
  desde: string;
  hasta: string;
  esDemo: boolean; // true si el FLUJO viene de muestra (patrimonio siempre real)

  // ── La foto ──
  entro: number; // ingresos del período
  salio: number; // egresos del período
  ganancia: number; // utilidad real = ventas − costo de lo vendido
  margenPct: number;
  gananciaPrev: number; // período anterior equivalente
  tendenciaPct: number; // % vs período anterior

  // ── Entradas ──
  ventasCount: number;
  porMetodo: MetodoBreak[];
  mostrador: number;
  delivery: number;
  ventasDetalle: VentaLinea[]; // ventas reales del período (para el detalle)

  // ── Salidas ──
  compras: number; // compras a proveedores (entradas de mercancía a costo)
  gastos: CategoriaGasto[]; // gastos operativos por categoría
  totalGastos: number;
  gastosDetalle: GastoLinea[]; // egresos reales de caja (para el detalle)

  // ── Patrimonio (SIEMPRE real) ──
  valorInventario: number; // costo × cantidad de todos los lotes
  plataEnCaja: number; // efectivo esperado en caja abierta
  capitalDormido: number; // valor de productos sin rotación reciente
  dormidoCount: number;

  // ── Salud ──
  serie: SerieFin[]; // ingresos vs egresos en el tiempo
  masRentables: ProductoRent[];
  menosRentables: ProductoRent[];

  // ── Cerebro (upgrade monster) ──
  tendencias: Tendencias; // ↑↓ % vs período anterior en cada número clave
  proyeccion: Proyeccion | null; // cierre de mes estimado al ritmo actual
  insights: Insights; // frases en cristiano generadas de los datos
};

export const PERIODOS: { value: FinanzasPeriodo; label: string }[] = [
  { value: "dia", label: "Hoy" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
];

// ── Muestra (un mes próspero, escalada por período) ──────────────
const ESCALA: Record<Exclude<FinanzasPeriodo, "custom">, number> = {
  dia: 1 / 26,
  semana: 7 / 30,
  mes: 1,
};

const METODO_PCT: { metodo: string; pct: number }[] = [
  { metodo: "Efectivo", pct: 56 },
  { metodo: "Transferencia", pct: 19 },
  { metodo: "Tarjeta débito", pct: 15 },
  { metodo: "Tarjeta crédito", pct: 10 },
];

function serieMuestra(periodo: Exclude<FinanzasPeriodo, "custom">): SerieFin[] {
  if (periodo === "dia") {
    const horas = ["8a", "10a", "12m", "2p", "4p", "6p", "8p"];
    return horas.map((h, i) => ({
      label: h,
      ingresos: [5200, 7400, 9100, 6800, 7900, 8600, 4200][i],
      egresos: [3100, 1200, 5400, 900, 1100, 4200, 700][i],
    }));
  }
  if (periodo === "semana") {
    const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const ing = [52000, 48000, 51000, 56000, 64000, 71000, 38000];
    const egr = [41000, 12000, 38000, 9000, 44000, 31000, 7000];
    return dias.map((d, i) => ({ label: d, ingresos: ing[i], egresos: egr[i] }));
  }
  const sem = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
  const ing = [312000, 298000, 341000, 365000];
  const egr = [214000, 176000, 248000, 191000];
  return sem.map((s, i) => ({ label: s, ingresos: ing[i], egresos: egr[i] }));
}

/** Construye el bloque de FLUJO de muestra para un período (patrimonio se inyecta aparte). */
export function muestraFlujo(periodo: Exclude<FinanzasPeriodo, "custom">) {
  const k = ESCALA[periodo];
  const entro = Math.round(1316000 * k);
  const ganancia = Math.round(entro * 0.34);
  const compras = Math.round(712000 * k);
  const gastos: CategoriaGasto[] = [
    { categoria: "Nómina", monto: Math.round(96000 * k) },
    { categoria: "Alquiler", monto: Math.round(45000 * k) },
    { categoria: "Servicios (luz/agua)", monto: Math.round(27000 * k) },
    { categoria: "Otros gastos", monto: Math.round(34000 * k) },
  ];
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
  const salio = compras + totalGastos;
  const ventasCount = Math.round(5180 * k);

  const porMetodo: MetodoBreak[] = METODO_PCT.map((m) => ({
    metodo: m.metodo,
    monto: Math.round((entro * m.pct) / 100),
    pct: m.pct,
  }));

  const gananciaPrev = Math.round(ganancia / 1.12); // +12% vs período anterior

  // Tendencias creíbles de muestra (mejora general, gasto controlado).
  const tendencias: Tendencias = {
    entro: { pct: 9, mejor: true },
    salio: { pct: 4, mejor: true }, // sube poco: la proporción de gasto mejora
    ganancia: { pct: 12, mejor: true },
    margen: { pct: 2, mejor: true },
  };
  // Proyección de cierre de mes (a este ritmo) — estimada.
  const proyeccion: Proyeccion = {
    ventas: Math.round(1316000 * 1.08),
    ganancia: Math.round(1316000 * 1.08 * 0.34),
    pctMes: 62,
  };

  return {
    entro,
    salio,
    ganancia,
    margenPct: Math.round((ganancia / entro) * 100),
    gananciaPrev,
    tendenciaPct: 12,
    ventasCount,
    porMetodo,
    mostrador: Math.round(entro * 0.78),
    delivery: Math.round(entro * 0.22),
    compras,
    gastos,
    totalGastos,
    serie: serieMuestra(periodo),
    tendencias,
    proyeccion,
  };
}

export const METODO_KEYS_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Tarjeta débito",
  tarjeta_credito: "Tarjeta crédito",
};
