// Tipos + datos de muestra creíbles para reportes (compartido cliente/servidor).
// El servidor intenta leer datos reales; si no hay suficientes, usa estos.

export type Periodo = "dia" | "semana" | "mes";

export type PuntoTiempo = { label: string; ventas: number };
export type BarItem = { nombre: string; valor: number };
export type MetodoSlice = { metodo: string; valor: number };
export type IngresoGasto = { label: string; ingresos: number; gastos: number };
export type ClienteRank = { nombre: string; compras: number; monto: number };

export type ReportesData = {
  periodo: Periodo;
  esDemo: boolean; // true si las ventas son de muestra (no reales aún)
  kpis: { ingresos: number; ventas: number; ticket: number; utilidad: number };
  ventasTiempo: PuntoTiempo[];
  masVendidos: BarItem[];
  porMetodo: MetodoSlice[];
  porEmpleado: BarItem[];
  ingresosGastos: IngresoGasto[];
  clientesFrecuentes: ClienteRank[];
  // Reales (de inventario / módulos):
  porVencer: { nombre: string; lote: string; dias: number; cantidad: number; productoId: string }[];
  bajoStock: { nombre: string; stock: number; minimo: number; productoId: string }[];
  controlados: { totalDespachos: number; totalUnidades: number };
  deliveries: { pendientes: number; enCamino: number; entregados: number };
};

// ── Generadores deterministas de muestra (sin azar, estables en SSR) ──
function serieMes(): PuntoTiempo[] {
  return Array.from({ length: 30 }, (_, i) => {
    const dia = i + 1;
    const finDeSemana = (i % 7 === 5 || i % 7 === 6) ? 0.7 : 1;
    const onda = 1 + 0.18 * Math.sin(i / 2.4);
    return { label: `${dia}`, ventas: Math.round(42000 * onda * finDeSemana + (i % 5) * 1200) };
  });
}
function serieSemana(): PuntoTiempo[] {
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const base = [52000, 48000, 51000, 56000, 64000, 71000, 38000];
  return dias.map((d, i) => ({ label: d, ventas: base[i] }));
}
function serieDia(): PuntoTiempo[] {
  const horas = ["8a", "9a", "10a", "11a", "12m", "1p", "2p", "3p", "4p", "5p", "6p", "7p"];
  const base = [1800, 3200, 4100, 5200, 6100, 4800, 3900, 4400, 5600, 6800, 5200, 3100];
  return horas.map((h, i) => ({ label: h, ventas: base[i] }));
}

export const MAS_VENDIDOS: BarItem[] = [
  { nombre: "Acetaminofén 500mg", valor: 412 },
  { nombre: "Amoxicilina 500mg", valor: 318 },
  { nombre: "Loratadina 10mg", valor: 264 },
  { nombre: "Omeprazol 20mg", valor: 231 },
  { nombre: "Ibuprofeno 400mg", valor: 198 },
  { nombre: "Losartán 50mg", valor: 176 },
  { nombre: "Metformina 850mg", valor: 154 },
];

export const POR_METODO: MetodoSlice[] = [
  { metodo: "Efectivo", valor: 58 },
  { metodo: "Transferencia", valor: 18 },
  { metodo: "Tarjeta débito", valor: 14 },
  { metodo: "Tarjeta crédito", valor: 10 },
];

export const POR_EMPLEADO: BarItem[] = [
  { nombre: "María Pérez", valor: 168400 },
  { nombre: "José Rodríguez", valor: 131200 },
  { nombre: "Ana Gómez", valor: 98600 },
  { nombre: "Propietaria", valor: 64300 },
];

export const INGRESOS_GASTOS: IngresoGasto[] = [
  { label: "Sem 1", ingresos: 312000, gastos: 184000 },
  { label: "Sem 2", ingresos: 298000, gastos: 171000 },
  { label: "Sem 3", ingresos: 341000, gastos: 196000 },
  { label: "Sem 4", ingresos: 365000, gastos: 203000 },
];

export const CLIENTES_FRECUENTES: ClienteRank[] = [
  { nombre: "Carmen Jiménez", compras: 14, monto: 18650 },
  { nombre: "Juana Díaz", compras: 11, monto: 13420 },
  { nombre: "Rafael Núñez", compras: 9, monto: 11200 },
  { nombre: "José Castillo", compras: 7, monto: 8900 },
  { nombre: "María Fernández", compras: 5, monto: 6100 },
];

export function muestraTiempo(periodo: Periodo): PuntoTiempo[] {
  return periodo === "dia" ? serieDia() : periodo === "semana" ? serieSemana() : serieMes();
}

/** KPIs de muestra coherentes con el período. */
export function muestraKpis(periodo: Periodo) {
  const t = muestraTiempo(periodo);
  const ingresos = t.reduce((s, p) => s + p.ventas, 0);
  const ventas = periodo === "dia" ? 213 : periodo === "semana" ? 1240 : 5180;
  return {
    ingresos,
    ventas,
    ticket: Math.round((ingresos / ventas) * 100) / 100,
    utilidad: Math.round(ingresos * 0.34),
  };
}

export const METODO_PAGO_KEYS = ["efectivo", "transferencia", "tarjeta_debito", "tarjeta_credito"] as const;
