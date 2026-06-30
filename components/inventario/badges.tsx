import { ShieldAlert, FileText, AlertTriangle, Receipt, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Distintivo de tratamiento de ITBIS: gravado 18% o exento. */
export function ItbisBadge({ gravado, className }: { gravado: boolean; className?: string }) {
  return gravado ? (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary", className)}>
      <Receipt className="h-3 w-3" />
      ITBIS 18%
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground", className)}>
      <BadgeCheck className="h-3 w-3" />
      Exento de ITBIS
    </span>
  );
}

/** Distintivo premium para medicamentos controlados. */
export function ControladoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger",
        className,
      )}
    >
      <ShieldAlert className="h-3 w-3" />
      Controlado
    </span>
  );
}

/** Distintivo premium para medicamentos que requieren receta. */
export function RecetaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent",
        className,
      )}
    >
      <FileText className="h-3 w-3" />
      Receta
    </span>
  );
}

type ExpiryLevel = "danger" | "warning" | "soon" | "ok";

function expiryLevel(dias: number): ExpiryLevel {
  if (dias <= 15) return "danger";
  if (dias <= 30) return "warning";
  if (dias <= 90) return "soon";
  return "ok";
}

const expiryStyles: Record<ExpiryLevel, string> = {
  danger: "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/10 text-warning",
  soon: "border-accent/30 bg-accent/10 text-accent",
  ok: "border-border bg-muted text-muted-foreground",
};

/** Píldora de vencimiento con color por urgencia. */
export function VencimientoBadge({
  dias,
  className,
}: {
  dias: number;
  className?: string;
}) {
  const level = expiryLevel(dias);
  const label =
    dias < 0
      ? "Vencido"
      : dias === 0
        ? "Vence hoy"
        : `Vence en ${dias}d`;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        expiryStyles[level],
        className,
      )}
    >
      {level === "danger" && <AlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  );
}

/** Indicador de bajo stock. */
export function BajoStockBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning",
        className,
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      Bajo stock
    </span>
  );
}
