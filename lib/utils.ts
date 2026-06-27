import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea montos en pesos dominicanos (RD$) con cifras tabulares. */
export function formatRD(value: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(value);
}

/** Normaliza un teléfono dominicano a formato internacional para WhatsApp (1 + 10 dígitos). */
export function telefonoWhatsapp(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  let d = telefono.replace(/\D/g, "");
  if (d.length === 10) d = "1" + d; // RD: anteponer código de país
  if (d.length < 11) return null;
  return d;
}

/** Construye un enlace wa.me con mensaje pre-armado. Null si el teléfono no sirve. */
export function whatsappLink(telefono: string | null | undefined, mensaje: string): string | null {
  const num = telefonoWhatsapp(telefono);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`;
}

/** Convierte un usuario visible en un email interno (el cliente nunca lo ve). */
export function usernameToEmail(username: string) {
  const domain = process.env.INTERNAL_EMAIL_DOMAIN || "jmfarmacia.local";
  const slug = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return `${slug}@${domain}`;
}
