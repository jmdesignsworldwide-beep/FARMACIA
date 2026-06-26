"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Barra que se llena con animación. `value` y `max` definen el porcentaje. */
export function FillBar({
  value,
  max = 100,
  className,
  barClassName,
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="tabular">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-primary to-accent",
            barClassName,
          )}
          initial={{ width: reduce ? `${pct}%` : 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
