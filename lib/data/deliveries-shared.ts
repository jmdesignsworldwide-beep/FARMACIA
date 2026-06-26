// Tipos y helpers de delivery (compartido cliente/servidor).

export type EstadoDelivery = "pendiente" | "en_camino" | "entregado" | "cancelado";

export type Delivery = {
  id: string;
  folio: number;
  cliente_id: string | null;
  cliente_nombre: string;
  telefono: string | null;
  direccion: string;
  sector: string | null;
  detalle: string | null;
  monto: number;
  metodo_pago: string | null;
  motorista_id: string | null;
  motorista_nombre: string | null;
  estado: EstadoDelivery;
  notas: string | null;
  empleado_nombre: string | null;
  created_at: string;
  entregado_at: string | null;
};

export const ESTADOS: { value: EstadoDelivery; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_camino", label: "En camino" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

export function estadoMeta(estado: string): { label: string; cls: string; dot: string } {
  switch (estado) {
    case "pendiente": return { label: "Pendiente", cls: "border-warning/30 bg-warning/10 text-warning", dot: "warning" };
    case "en_camino": return { label: "En camino", cls: "border-accent/30 bg-accent/10 text-accent", dot: "primary" };
    case "entregado": return { label: "Entregado", cls: "border-success/30 bg-success/10 text-success", dot: "success" };
    case "cancelado": return { label: "Cancelado", cls: "border-danger/30 bg-danger/10 text-danger", dot: "danger" };
    default: return { label: estado, cls: "border-border bg-muted text-muted-foreground", dot: "primary" };
  }
}

export const DISCLAIMER_DELIVERY =
  "Delivery y tracking de demostración. La integración real con GPS y motoristas se configura en la versión de producción.";
