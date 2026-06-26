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

/** Convierte un usuario visible en un email interno (el cliente nunca lo ve). */
export function usernameToEmail(username: string) {
  const domain = process.env.INTERNAL_EMAIL_DOMAIN || "jmfarmacia.local";
  const slug = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return `${slug}@${domain}`;
}
