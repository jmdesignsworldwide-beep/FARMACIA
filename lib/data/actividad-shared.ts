// Etiquetas de tipos de actividad (compartido cliente/servidor).

export const TIPO_LABEL: Record<string, string> = {
  venta: "Venta",
  venta_anulada: "Venta anulada",
  entrada_mercancia: "Entrada de mercancía",
  ajuste_inventario: "Ajuste de inventario",
  receta_despachada: "Receta despachada",
  cambio_precio: "Cambio de precio",
  receta_registrada: "Receta registrada",
  caja_apertura: "Apertura de caja",
  caja_cierre: "Cierre de caja",
  empleado_creado: "Empleado creado",
  empleado_editado: "Empleado editado",
  acceso_denegado: "Acceso denegado",
};

export const TIPOS_ACTIVIDAD = Object.keys(TIPO_LABEL);

export function tipoLabel(t: string): string {
  return TIPO_LABEL[t] ?? t;
}
