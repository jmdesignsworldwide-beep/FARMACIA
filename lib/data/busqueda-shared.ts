// Búsqueda global — tipos compartidos cliente/servidor.

export type SearchTipo = "producto" | "cliente" | "venta" | "empleado" | "proveedor";

export type SearchItem = {
  id: string;
  titulo: string;
  sub: string;
  href: string;
};

export type SearchGrupo = {
  tipo: SearchTipo;
  label: string;
  items: SearchItem[];
};

export const TIPO_LABEL: Record<SearchTipo, string> = {
  producto: "Productos",
  cliente: "Clientes",
  venta: "Ventas",
  empleado: "Empleados",
  proveedor: "Proveedores",
};
