import { Info } from "lucide-react";
import { DISCLAIMER_CONTROLADOS } from "@/lib/data/recetas-shared";
import { cn } from "@/lib/utils";

/** Disclaimer de demostración para controlados (protege la marca). */
export function DisclaimerControlados({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground", className)}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>{DISCLAIMER_CONTROLADOS}</p>
    </div>
  );
}
