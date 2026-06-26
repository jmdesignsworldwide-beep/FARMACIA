// Tipos y helpers de recetas/controlados (compartido cliente/servidor).

export type RecetaItem = {
  id: string;
  receta_id: string;
  producto_id: string | null;
  nombre_medicamento: string;
  cantidad: number;
  indicaciones: string | null;
  controlado: boolean;
};

export type Receta = {
  id: string;
  numero: string;
  medico_nombre: string;
  medico_colegiatura: string | null;
  paciente_nombre: string;
  paciente_cedula: string | null;
  fecha: string;
  notas: string | null;
  controlada: boolean;
  origen: "manual" | "pos";
  estado: "registrada" | "despachada";
  foto_url: string | null;
  venta_id: string | null;
  empleado_nombre: string | null;
  created_at: string;
};

export type RecetaResumen = Receta & { items_count: number };

export type LibroEntry = {
  id: string;
  receta_id: string | null;
  venta_id: string | null;
  producto_id: string | null;
  producto_nombre: string;
  cantidad: number;
  medico_nombre: string | null;
  medico_colegiatura: string | null;
  paciente_nombre: string | null;
  paciente_cedula: string | null;
  numero_receta: string | null;
  empleado_nombre: string | null;
  created_at: string;
};

export type ProductoReceta = {
  id: string;
  nombre_comercial: string;
  nombre_generico: string;
  presentacion: string | null;
  controlado: boolean;
};

/** Vigencia estándar de una receta (días). Demostración. */
export const VIGENCIA_DIAS = 30;

export function diasDesde(fecha: string): number {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / 86_400_000);
}

/** ¿La receta está vencida? (registrada y más vieja que la vigencia). */
export function recetaVencida(r: { fecha: string; estado: string }): boolean {
  return r.estado === "registrada" && diasDesde(r.fecha) > VIGENCIA_DIAS;
}

export const DISCLAIMER_CONTROLADOS =
  "Funcionalidad de demostración. El cumplimiento regulatorio real de medicamentos controlados (reportes a las autoridades de salud) se configura en la versión de producción.";
