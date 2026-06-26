"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme/theme-provider";

export type ChartColors = {
  primary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  text: string;
  muted: string;
  grid: string;
  card: string;
  border: string;
  palette: string[];
};

function readVar(name: string): string {
  if (typeof window === "undefined") return "0 0% 50%";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "0 0% 50%";
}
const hsl = (v: string) => `hsl(${v})`;

/** Lee los tokens de color del tema actual como colores concretos para Recharts. */
export function useChartColors(): ChartColors {
  const { theme } = useTheme();
  const [colors, setColors] = useState<ChartColors>(() => compute());

  function compute(): ChartColors {
    const primary = hsl(readVar("--primary"));
    const accent = hsl(readVar("--accent"));
    const success = hsl(readVar("--success"));
    const warning = hsl(readVar("--warning"));
    const danger = hsl(readVar("--danger"));
    return {
      primary, accent, success, warning, danger,
      text: hsl(readVar("--foreground")),
      muted: hsl(readVar("--muted-foreground")),
      grid: `hsl(${readVar("--border")} / 0.6)`,
      card: hsl(readVar("--card")),
      border: hsl(readVar("--border")),
      palette: [primary, accent, hsl(readVar("--warning")), danger, success],
    };
  }

  // Recalcula cuando cambia el tema (la clase .dark cambia los tokens).
  useEffect(() => {
    // Espera un frame para que el DOM aplique la clase del tema.
    const id = requestAnimationFrame(() => setColors(compute()));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return colors;
}
