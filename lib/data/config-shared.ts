// Tipos de configuración (compartido cliente/servidor).

export type MetodosPago = {
  efectivo: boolean;
  transferencia: boolean;
  tarjeta_debito: boolean;
  tarjeta_credito: boolean;
};

export type Config = {
  nombre_farmacia: string;
  logo_url: string | null;
  rnc: string | null;
  direccion: string | null;
  telefono: string | null;
  stock_minimo_default: number;
  dias_alerta_vencimiento: number;
  metodos_pago: MetodosPago;
};

export const CONFIG_DEFAULT: Config = {
  nombre_farmacia: "JM Farmacia",
  logo_url: null,
  rnc: null,
  direccion: null,
  telefono: null,
  stock_minimo_default: 10,
  dias_alerta_vencimiento: 30,
  metodos_pago: {
    efectivo: true,
    transferencia: true,
    tarjeta_debito: true,
    tarjeta_credito: true,
  },
};
