import { Cross } from "lucide-react";
import { cn } from "@/lib/utils";

/** Logotipo de marca: cruz de salud en gradiente verde→turquesa + wordmark. */
export function Brand({
  className,
  compact = false,
  name = "JM Farmacia",
}: {
  className?: string;
  compact?: boolean;
  name?: string;
}) {
  // Resalta la segunda palabra con el gradiente de marca (si existe).
  const partes = name.trim().split(" ");
  const primera = partes[0];
  const resto = partes.slice(1).join(" ");
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-elev-2">
        <Cross className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="text-lg font-semibold tracking-tight">
          {primera} {resto && <span className="text-gradient-brand">{resto}</span>}
        </span>
      )}
    </div>
  );
}
