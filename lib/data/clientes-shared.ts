// Tipos de clientes (compartido cliente/servidor).

export type Cliente = {
  id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  alergias: string[];
  notas: string | null;
  balance: number;
  frecuente: boolean;
  empleado_nombre: string | null;
  created_at: string;
};

export type ClienteBasico = {
  id: string;
  nombre: string;
  cedula: string | null;
  alergias: string[];
};

export function edad(fecha: string | null): number | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 86_400_000));
}
