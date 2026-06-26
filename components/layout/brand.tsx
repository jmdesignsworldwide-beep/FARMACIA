import { Cross } from "lucide-react";
import { cn } from "@/lib/utils";

/** Logotipo de marca: cruz de salud en gradiente verde→turquesa + wordmark. */
export function Brand({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-elev-2">
        <Cross className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="text-lg font-semibold tracking-tight">
          JM <span className="text-gradient-brand">Farmacia</span>
        </span>
      )}
    </div>
  );
}
