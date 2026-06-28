// Venta por CAJA o DETALLADO (unidad). El stock es SIEMPRE en unidades;
// la caja es un múltiplo (unidades_por_caja). Helpers compartidos cliente/servidor.

export type ModoVenta = "caja" | "unidad";

/** Configuración de presentación de un producto. */
export type PresentacionConfig = {
  unidades_por_caja: number;
  vende_caja: boolean;
  precio_caja: number;
  vende_unidad: boolean;
  precio_venta: number; // precio por unidad (fuente única, no se duplica)
};

/** ¿Cuántas cajas completas + sueltas representan N unidades? */
export function equivCajas(unidades: number, upc: number): { cajas: number; sueltas: number } {
  if (upc <= 1) return { cajas: 0, sueltas: unidades };
  return { cajas: Math.floor(unidades / upc), sueltas: unidades % upc };
}

/** Texto del stock en unidades + su equivalente en cajas (si aplica). */
export function stockLabel(unidades: number, upc: number, vendeCaja: boolean): string {
  const base = `${unidades} ${unidades === 1 ? "unidad" : "unidades"}`;
  if (!vendeCaja || upc <= 1) return base;
  const { cajas, sueltas } = equivCajas(unidades, upc);
  if (cajas === 0) return base;
  return `${base} · ${cajas} caja${cajas === 1 ? "" : "s"}${sueltas ? ` + ${sueltas}` : ""}`;
}

/** Etiqueta de la presentación de una línea de venta. */
export function presentacionEtiqueta(modo: ModoVenta, upc: number): string {
  return modo === "caja" ? `Caja (${upc} u.)` : "Unidad";
}

/** Precio según el modo de venta. */
export function precioModo(p: PresentacionConfig, modo: ModoVenta): number {
  return modo === "caja" ? p.precio_caja : p.precio_venta;
}

/** Unidades de stock que consume 1 "pieza" del modo elegido. */
export function unidadesPorModo(p: PresentacionConfig, modo: ModoVenta): number {
  return modo === "caja" ? Math.max(1, p.unidades_por_caja) : 1;
}

/** Modo por defecto: si solo se vende de una forma, esa; si ambas, unidad. */
export function modoPorDefecto(p: PresentacionConfig): ModoVenta {
  if (p.vende_unidad) return "unidad";
  if (p.vende_caja) return "caja";
  return "unidad";
}
