"use client";

import { cn } from "@/lib/utils";

type Tone = "primary" | "warning" | "danger" | "success";

const toneMap: Record<Tone, string> = {
  primary: "bg-primary",
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
};

/**
 * Indicador que "late" (heartbeat) para alertas: por vencer, ventas de hoy, etc.
 * El anillo expansivo se desactiva con prefers-reduced-motion (vía CSS global).
 */
export function PulseDot({
  tone = "primary",
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex h-2.5 w-2.5", className)}>
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
          toneMap[tone],
        )}
      />
      <span
        className={cn(
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          toneMap[tone],
        )}
      />
    </span>
  );
}
