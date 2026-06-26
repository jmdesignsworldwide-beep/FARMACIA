// Tipos y helpers de ventas/caja compartidos entre cliente y servidor.
// (Sin "server-only": los importan también los componentes cliente.)

export type LoteVendible = {
  id: string;
  numero_lote: string;
  cantidad: number;
  fecha_vencimiento: string;
};

export type ProductoVendible = {
  id: string;
  nombre_comercial: string;
  nombre_generico: string;
  concentracion: string | null;
  presentacion: string | null;
  categoria: string;
  codigo_barras: string | null;
  precio_venta: number;
  controlado: boolean;
  requiere_receta: boolean;
  stock_total: number;
  lotes: LoteVendible[];
};

export type Caja = {
  id: string;
  estado: "abierta" | "cerrada";
  monto_inicial: number;
  monto_contado: number | null;
  diferencia: number | null;
  notas: string | null;
  abierta_at: string;
  cerrada_at: string | null;
};

export type CajaResumen = {
  caja: Caja;
  ventasCount: number;
  totalVentas: number;
  porMetodo: Record<string, number>;
  totalEgresos: number;
  efectivoEsperado: number;
};

export type EgresoRow = {
  id: string;
  monto: number;
  motivo: string;
  created_at: string;
};

export type LoteUsado = {
  lote_id: string;
  numero_lote: string;
  cantidad: number;
  fecha_vencimiento: string;
};

export type VentaItem = {
  id: string;
  producto_id: string | null;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  lotes_usados: LoteUsado[];
};

export type MetodoPago =
  | "efectivo"
  | "transferencia"
  | "tarjeta_debito"
  | "tarjeta_credito";

export type Venta = {
  id: string;
  folio: number;
  caja_id: string | null;
  subtotal: number;
  descuento: number;
  total: number;
  metodo_pago: MetodoPago;
  monto_recibido: number | null;
  cambio: number;
  voucher: string | null;
  estado: "completada" | "anulada";
  receta_medico: string | null;
  receta_paciente: string | null;
  receta_numero: string | null;
  empleado_nombre: string | null;
  anulada_nombre: string | null;
  anulada_at: string | null;
  motivo_anulacion: string | null;
  created_at: string;
};

export type VentaResumen = Pick<
  Venta,
  "id" | "folio" | "total" | "metodo_pago" | "estado" | "empleado_nombre" | "created_at"
> & { items_count: number };

export type VentasHoy = {
  total: number;
  count: number;
  porMetodo: Record<string, number>;
  topProducto: { nombre: string; unidades: number } | null;
  ticketPromedio: number;
};

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta_debito", label: "Tarjeta débito" },
  { value: "tarjeta_credito", label: "Tarjeta crédito" },
];

export function metodoLabel(m: string) {
  return METODOS_PAGO.find((x) => x.value === m)?.label ?? m;
}
