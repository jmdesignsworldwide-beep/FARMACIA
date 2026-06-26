// Tipos de proveedores (compartido cliente/servidor).

export type TipoProveedor = "laboratorio" | "distribuidor" | "importador" | "otro";

export type Proveedor = {
  id: string;
  nombre: string;
  tipo: TipoProveedor;
  telefono: string | null;
  email: string | null;
  rnc: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
  empleado_nombre: string | null;
  created_at: string;
};

export type ProveedorBasico = { id: string; nombre: string };

export const TIPOS_PROVEEDOR: { value: TipoProveedor; label: string }[] = [
  { value: "laboratorio", label: "Laboratorio" },
  { value: "distribuidor", label: "Distribuidor" },
  { value: "importador", label: "Importador" },
  { value: "otro", label: "Otro" },
];

export function tipoProveedorLabel(t: string) {
  return TIPOS_PROVEEDOR.find((x) => x.value === t)?.label ?? t;
}
