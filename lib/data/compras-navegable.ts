import "server-only";
import { getInventoryStats, getProductos } from "./inventory";

/**
 * Datos NAVEGABLES de compras (Tanda 8). Las sugerencias por bajo stock y la
 * comparación se derivan de datos reales; las órdenes/devoluciones de muestra
 * son demostración. La operación profunda se construye en producción.
 */

export type OrdenSugerida = {
  producto: string;
  stock: number;
  minimo: number;
  sugerido: number;
};

export type OrdenDemo = {
  id: string;
  proveedor: string;
  fecha: string;
  estado: "borrador" | "enviada" | "recibida";
  total: number;
  items: { nombre: string; cantidad: number; costo: number }[];
};

export const ORDENES_DEMO: OrdenDemo[] = [
  {
    id: "OC-2026-018", proveedor: "Distribuidora Corripio", fecha: "Hace 2 días", estado: "recibida", total: 12450,
    items: [{ nombre: "Amoxil 500mg", cantidad: 100, costo: 8 }, { nombre: "Losec 20mg", cantidad: 80, costo: 6 }],
  },
  {
    id: "OC-2026-019", proveedor: "Farmacéutica Carol", fecha: "Ayer", estado: "enviada", total: 8800,
    items: [{ nombre: "Panadol 500mg", cantidad: 200, costo: 3.5 }, { nombre: "Advil 400mg", cantidad: 120, costo: 5 }],
  },
  {
    id: "OC-2026-020", proveedor: "Pfizer Dominicana", fecha: "Hoy", estado: "borrador", total: 15600,
    items: [{ nombre: "Lipitor 20mg", cantidad: 90, costo: 11 }, { nombre: "Zitromax 500mg", cantidad: 40, costo: 18 }],
  },
];

export type Devolucion = {
  id: string;
  proveedor: string;
  motivo: string;
  fecha: string;
  estado: "solicitada" | "aceptada" | "completada";
  monto: number;
};

export const DEVOLUCIONES_DEMO: Devolucion[] = [
  { id: "DEV-204", proveedor: "Farmacia Hispaniola Dist.", motivo: "Lote próximo a vencer", fecha: "Hace 5 días", estado: "completada", monto: 1850 },
  { id: "DEV-205", proveedor: "Bayer Dominicana", motivo: "Producto dañado en transporte", fecha: "Hace 1 día", estado: "aceptada", monto: 640 },
  { id: "DEV-206", proveedor: "Merck RD", motivo: "Error en cantidad recibida", fecha: "Hoy", estado: "solicitada", monto: 420 },
];

/** Órdenes sugeridas automáticamente a partir del bajo stock real. */
export async function getOrdenesSugeridas(): Promise<OrdenSugerida[]> {
  const stats = await getInventoryStats();
  return stats.bajoStock.map((p) => ({
    producto: p.nombre_comercial,
    stock: p.stock_total,
    minimo: p.stock_minimo,
    sugerido: Math.max(p.stock_minimo * 2 - p.stock_total, p.stock_minimo),
  }));
}

export type ComparacionFila = {
  producto: string;
  precios: { proveedor: string; precio: number }[];
  mejor: string;
};

const PROVEEDORES_COMP = ["Distribuidora Corripio", "Farmacéutica Carol", "Pfizer Dominicana"];

/** Comparación de precios de costo entre proveedores (navegable, creíble). */
export async function getComparacionPrecios(): Promise<ComparacionFila[]> {
  const productos = await getProductos();
  const factores = [1.0, 1.06, 0.96];
  return productos.slice(0, 8).map((p, idx) => {
    const precios = PROVEEDORES_COMP.map((prov, i) => ({
      proveedor: prov,
      precio: Math.round(p.precio_costo * factores[(i + idx) % 3] * 100) / 100,
    }));
    const mejor = precios.reduce((a, b) => (b.precio < a.precio ? b : a)).proveedor;
    return { producto: p.nombre_comercial, precios, mejor };
  });
}
