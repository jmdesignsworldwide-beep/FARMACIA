import { ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Sello que comunica que el historial es permanente e imborrable. */
export function SelloInviolable({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 px-3.5 py-2 shadow-elev-1",
        className,
      )}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elev-1">
        <ShieldCheck className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <p className="flex items-center gap-1 text-xs font-semibold">
          <Lock className="h-3 w-3" /> Registro permanente e inviolable
        </p>
        <p className="text-[11px] text-muted-foreground">
          Solo se agrega; nadie puede editar ni borrar — ni el administrador.
        </p>
      </div>
    </div>
  );
}
