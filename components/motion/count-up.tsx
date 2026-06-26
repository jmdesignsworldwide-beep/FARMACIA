"use client";

import { useEffect, useRef, useState } from "react";
import {
  useInView,
  useMotionValue,
  useReducedMotion,
  animate,
} from "framer-motion";
import { cn, formatRD } from "@/lib/utils";

type CountUpProps = {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Formatea como pesos dominicanos (RD$). Apto para Server Components. */
  currency?: boolean;
  /** Formateador opcional (solo en Client Components). Prioritario. */
  format?: (n: number) => string;
};

/** Count-up para KPIs y montos. Cifras tabulares, respeta reduced-motion. */
export function CountUp({
  value,
  duration = 1.4,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  currency = false,
  format,
}: CountUpProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(() =>
    render(reduce ? value : 0),
  );

  function render(n: number) {
    if (format) return format(n);
    if (currency) return formatRD(n);
    return (
      prefix +
      n.toLocaleString("es-DO", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) +
      suffix
    );
  }

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(render(value));
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(render(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce]);

  return (
    <span ref={ref} data-tabular className={cn("tabular", className)}>
      {display}
    </span>
  );
}
