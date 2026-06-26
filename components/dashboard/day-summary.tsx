"use client";

import { Banknote, Pill, Receipt } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import type { DashboardData } from "@/lib/data/dashboard";

/** Vistazo compacto del día (no es un gráfico — eso vive en Reportes). */
export function DaySummary({
  summary,
}: {
  summary: DashboardData["daySummary"];
}) {
  return (
    <div className="glass flex h-full flex-col rounded-2xl p-5 shadow-elev-2">
      <h2 className="text-base font-semibold tracking-tight">Resumen del día</h2>

      <dl className="mt-4 flex flex-col gap-3">
        <Row
          icon={<Banknote className="h-4 w-4" />}
          label="Pago más usado"
        >
          <span className="font-semibold">{summary.topPaymentMethod.label}</span>
          <span className="tabular ml-1 text-muted-foreground">
            · {summary.topPaymentMethod.pct}%
          </span>
        </Row>

        <Row icon={<Pill className="h-4 w-4" />} label="Más vendido hoy">
          <span className="truncate font-semibold">{summary.topProduct.name}</span>
          <span className="tabular ml-1 text-muted-foreground">
            · {summary.topProduct.units} uds
          </span>
        </Row>

        <Row icon={<Receipt className="h-4 w-4" />} label="Ticket promedio">
          <span className="font-semibold">
            <CountUp value={summary.ticketAverage} currency />
          </span>
        </Row>
      </dl>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="min-w-0 truncate text-right text-sm">{children}</dd>
      </div>
    </div>
  );
}
