// ITBIS (impuesto dominicano, 18%). En RD los medicamentos suelen estar EXENTOS
// y los no-medicamentos (cosméticos, higiene, etc.) GRAVADOS. El cálculo real vive
// en el SERVIDOR (RPC registrar_venta); este helper lo replica para la vista en vivo
// del POS, usando EXACTAMENTE la misma fórmula para que cuadre al centavo.
//
// ⚠️ ITBIS y facturación SIMULADOS para demostración. El tratamiento fiscal real
// (exenciones, tasas, NCF/DGII) se configura y verifica en producción.

export const ITBIS_RATE = 0.18;

export type ItbisLinea = { base: number; gravado: boolean };

export type ItbisDesglose = {
  subtotal: number; // suma de líneas (antes de descuento e ITBIS)
  baseGravable: number; // porción gravada (antes de descuento)
  descuento: number; // descuento aplicado (acotado al subtotal)
  itbis: number; // ITBIS sobre la base gravable, prorrateado por el descuento
  total: number; // subtotal − descuento + itbis (lo que paga el cliente)
};

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Desglose de ITBIS. El descuento global se prorratea sobre la base gravable
 * (misma lógica que el servidor) para no cobrar impuesto sobre lo descontado.
 */
export function calcularDesglose(lineas: ItbisLinea[], descuento = 0): ItbisDesglose {
  const subtotal = lineas.reduce((s, l) => s + l.base, 0);
  const baseGravable = lineas.reduce((s, l) => s + (l.gravado ? l.base : 0), 0);
  const desc = Math.min(Math.max(descuento, 0), subtotal);
  const factor = subtotal > 0 ? (subtotal - desc) / subtotal : 1;
  const itbis = r2(baseGravable * factor * ITBIS_RATE);
  const total = r2(subtotal - desc + itbis);
  return { subtotal: r2(subtotal), baseGravable: r2(baseGravable), descuento: r2(desc), itbis, total };
}
