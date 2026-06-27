// Acceso temporal de demo (Capa B, JM Designs) — tipos + helpers compartidos.
// La validación REAL ocurre en el servidor; esto es solo presentación.

export type DemoAcceso = {
  id: string;
  user_id: string;
  username: string;
  es_admin_demo: boolean;
  vence_at: string | null; // null = sin vencimiento
  dias_otorgados: number | null;
  activo: boolean;
  notas: string | null;
  created_at: string;
};

export type EstadoVigencia = "permanente" | "vigente" | "por_vencer" | "vencida" | "desactivada";

export type MiAcceso = {
  esAdminDemo: boolean;
  venceAt: string | null;
  activo: boolean;
  vigente: boolean;
};

/** Días entre hoy y la fecha de vencimiento (positivo = restantes, negativo = vencida). */
export function diasRestantes(venceAt: string | null): number | null {
  if (!venceAt) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(venceAt);
  fin.setHours(0, 0, 0, 0);
  return Math.round((fin.getTime() - hoy.getTime()) / 86_400_000);
}

export function estadoVigencia(acceso: Pick<DemoAcceso, "vence_at" | "activo">): EstadoVigencia {
  if (!acceso.activo) return "desactivada";
  if (!acceso.vence_at) return "permanente";
  const d = diasRestantes(acceso.vence_at)!;
  if (d < 0) return "vencida";
  if (d <= 3) return "por_vencer";
  return "vigente";
}

export const VIGENCIA_META: Record<EstadoVigencia, { label: string; cls: string; dot: "success" | "warning" | "danger" | "primary" }> = {
  permanente: { label: "Sin vencimiento", cls: "border-accent/30 bg-accent/10 text-accent", dot: "primary" },
  vigente: { label: "Vigente", cls: "border-success/30 bg-success/10 text-success", dot: "success" },
  por_vencer: { label: "Vence pronto", cls: "border-warning/30 bg-warning/10 text-warning", dot: "warning" },
  vencida: { label: "Vencida", cls: "border-danger/30 bg-danger/10 text-danger", dot: "danger" },
  desactivada: { label: "Desactivada", cls: "border-border bg-muted text-muted-foreground", dot: "primary" },
};

/** Opciones rápidas de vigencia para el panel de admin del demo. */
export const VIGENCIAS: { value: string; label: string; dias: number | null }[] = [
  { value: "7", label: "7 días", dias: 7 },
  { value: "15", label: "15 días", dias: 15 },
  { value: "30", label: "30 días", dias: 30 },
  { value: "custom", label: "Personalizado", dias: null },
  { value: "none", label: "Sin vencimiento", dias: null },
];

/** Datos de contacto de JM Designs (pantalla de expiración). */
export const JM_CONTACTO = {
  telefono: "809-707-2997",
  telefonoDigits: "18097072997",
  instagram: "jm.designs.worldwide",
  instagramUrl: "https://instagram.com/jm.designs.worldwide",
  correo: "jm.designs.worldwide@gmail.com",
};
