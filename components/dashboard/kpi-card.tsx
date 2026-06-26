"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, type LucideIcon } from "lucide-react";
import { Magnetic } from "@/components/motion/magnetic";
import { CountUp } from "@/components/motion/count-up";
import { PulseDot } from "@/components/motion/pulse-dot";
import { cn } from "@/lib/utils";

type Variant = "positive" | "alert";

export type KpiCardProps = {
  title: string;
  href: string;
  icon: LucideIcon;
  value: number;
  /** Formatea como RD$ */
  currency?: boolean;
  /** Texto de apoyo cuando hay calma / positivo */
  subtitle: string;
  /** Texto de apoyo cuando la alerta está activa (urgencia) */
  alertSubtitle?: string;
  variant?: Variant;
  /** Para variant="alert": true cuando hay algo que atender (late con tensión). */
  alertActive?: boolean;
};

/**
 * KPI grande de la sala de mando.
 * - "positive": count-up alegre, calma.
 * - "alert" + alertActive: ámbar, late con tensión, glow que respira.
 * - "alert" sin actividad: verde "todo al día", quieto.
 */
export function KpiCard({
  title,
  href,
  icon: Icon,
  value,
  currency = false,
  subtitle,
  alertSubtitle,
  variant = "positive",
  alertActive = false,
}: KpiCardProps) {
  const reduce = useReducedMotion();
  const tense = variant === "alert" && alertActive;
  const allClear = variant === "alert" && !alertActive;

  return (
    <Link href={href} className="group block h-full focus:outline-none">
      <Magnetic strength={0.16} className="h-full">
        <div
          className={cn(
            "glass relative h-full overflow-hidden rounded-2xl p-5 shadow-elev-2",
            "transition-shadow duration-300 group-hover:shadow-elev-3",
            "focus-visible:ring-2 focus-visible:ring-ring",
            tense && "shadow-glow",
          )}
        >
          {/* Glow ámbar que respira cuando hay tensión */}
          {tense && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-warning/30 blur-2xl"
              initial={{ opacity: 0.4 }}
              animate={reduce ? { opacity: 0.4 } : { opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <div className="relative flex items-start justify-between">
            <p className="text-sm font-medium tracking-tight text-muted-foreground">
              {title}
            </p>
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors",
                tense
                  ? "bg-warning/15 text-warning"
                  : allClear
                    ? "bg-success/15 text-success"
                    : "bg-primary/12 text-primary",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
          </div>

          <p className="tabular relative mt-3 text-[2.1rem] font-semibold leading-none tracking-tight sm:text-4xl">
            <CountUp value={value} currency={currency} />
          </p>

          <div className="relative mt-3 flex min-h-[1.25rem] items-center gap-1.5 text-xs">
            {tense ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-warning">
                <PulseDot tone="warning" />
                {alertSubtitle ?? subtitle}
              </span>
            ) : allClear ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <Check className="h-3.5 w-3.5" />
                {subtitle}
              </span>
            ) : (
              <span className="text-muted-foreground">{subtitle}</span>
            )}
          </div>

          {/* Afordancia de clic */}
          <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/50 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
        </div>
      </Magnetic>
    </Link>
  );
}
