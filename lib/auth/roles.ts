// Roles internos de la farmacia y sus permisos.
// Compartido cliente/servidor; la validación REAL ocurre en el servidor.

export type Rol = "dueno" | "admin" | "farmaceutico" | "cajero" | "motorista";

export const ROLES: { value: Rol; label: string; descripcion: string }[] = [
  { value: "dueno", label: "Dueño / Super Admin", descripcion: "Acceso total a todo el sistema." },
  { value: "admin", label: "Administrador", descripcion: "Casi total. No puede borrar el historial (nadie puede)." },
  { value: "farmaceutico", label: "Farmacéutico", descripcion: "Vende, despacha recetas y ve inventario." },
  { value: "cajero", label: "Cajero", descripcion: "Solo vende y ve sus propias ventas." },
  { value: "motorista", label: "Motorista", descripcion: "Solo ve sus entregas asignadas." },
];

export function rolLabel(rol: string): string {
  return ROLES.find((r) => r.value === rol)?.label ?? rol;
}

// Capacidades del sistema.
export type Capacidad =
  | "ver_dashboard"
  | "usar_pos"
  | "ver_ventas_todas"
  | "usar_caja"
  | "ver_inventario"
  | "editar_inventario"
  | "ver_empleados"
  | "gestionar_empleados"
  | "ver_historial"
  | "ver_reportes"
  | "ver_entregas";

const MATRIZ: Record<Rol, Capacidad[]> = {
  dueno: [
    "ver_dashboard", "usar_pos", "ver_ventas_todas", "usar_caja", "ver_inventario",
    "editar_inventario", "ver_empleados", "gestionar_empleados", "ver_historial",
    "ver_reportes", "ver_entregas",
  ],
  admin: [
    "ver_dashboard", "usar_pos", "ver_ventas_todas", "usar_caja", "ver_inventario",
    "editar_inventario", "ver_empleados", "gestionar_empleados", "ver_historial",
    "ver_reportes", "ver_entregas",
  ],
  farmaceutico: [
    "ver_dashboard", "usar_pos", "ver_ventas_todas", "usar_caja", "ver_inventario",
    "editar_inventario",
  ],
  cajero: ["ver_dashboard", "usar_pos", "usar_caja"],
  motorista: ["ver_entregas"],
};

export function can(rol: string | null | undefined, cap: Capacidad): boolean {
  if (!rol) return false;
  return MATRIZ[rol as Rol]?.includes(cap) ?? false;
}

/** Página de inicio según el rol (a dónde mandar tras login / accesos denegados). */
export function homePathForRol(rol: string | null | undefined): string {
  if (rol === "motorista") return "/entregas";
  if (rol === "cajero") return "/ventas";
  return "/dashboard";
}
