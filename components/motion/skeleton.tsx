import { cn } from "@/lib/utils";

/** Skeleton elegante con shimmer para estados de carga. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted/70",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-foreground/10 after:to-transparent",
        className,
      )}
    />
  );
}
