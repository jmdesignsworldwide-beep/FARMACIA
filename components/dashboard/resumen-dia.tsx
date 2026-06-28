"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, CalendarClock, Wallet, PackageX, Star } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { formatRD, cn } from "@/lib/utils";

function saludoPorHora(h: number): string {
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Chip de dato resaltado y clickeable a su módulo. */
function Chip({ href, icon: Icon, tone, children }: {
  href: string; icon: typeof Wallet; tone: "primary" | "warning" | "danger"; children: React.ReactNode;
}) {
  const cls = tone === "danger" ? "border-danger/30 bg-danger/10 text-danger"
    : tone === "warning" ? "border-warning/30 bg-warning/10 text-warning"
    : "border-primary/30 bg-primary/10 text-primary";
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold transition-colors hover:brightness-105", cls)}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </Link>
  );
}

export function ResumenDia({
  nombre, lotesSemana, enCaja, bajoStock, topProducto, esDemo,
}: {
  nombre: string;
  lotesSemana: number;
  enCaja: number;
  bajoStock: number;
  topProducto: { name: string; units: number };
  esDemo: boolean;
}) {
  const [saludo, setSaludo] = useState("Hola");
  useEffect(() => setSaludo(saludoPorHora(new Date().getHours())), []);

  const hayTop = topProducto.name && topProducto.name !== "—";

  return (
    <Reveal>
      <div className="glass relative overflow-hidden rounded-2xl border border-primary/20 p-5 shadow-elev-2 sm:p-6">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-12 left-1/3 h-36 w-36 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            {saludo}, <span className="text-gradient-brand">{nombre}</span>.
          </h2>

          <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm leading-relaxed text-muted-foreground">
            Hoy tienes
            <Chip href="/inventario/alertas" icon={CalendarClock} tone={lotesSemana > 0 ? "warning" : "primary"}>
              <CountUp value={lotesSemana} /> {lotesSemana === 1 ? "lote" : "lotes"} por vencer esta semana
            </Chip>
            <Chip href="/ventas/caja" icon={Wallet} tone="primary">
              <CountUp value={enCaja} currency /> en caja
            </Chip>
            y
            <Chip href="/inventario" icon={PackageX} tone={bajoStock > 0 ? "danger" : "primary"}>
              <CountUp value={bajoStock} /> en bajo stock
            </Chip>
            .
            {hayTop && (
              <span className="inline-flex items-center gap-1.5">
                Tu producto estrella:
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Star className="h-3.5 w-3.5 text-primary" /> {topProducto.name}
                </span>
                {topProducto.units > 0 && <span className="text-xs">({topProducto.units} uds)</span>}.
              </span>
            )}
          </p>

          {esDemo && (
            <p className="mt-2 text-[11px] text-muted-foreground/80">
              Ventas del día con datos de muestra; por vencer y bajo stock son reales de tu inventario.
            </p>
          )}
        </div>
      </div>
    </Reveal>
  );
}
