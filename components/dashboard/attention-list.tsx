"use client";

import Link from "next/link";
import { CalendarClock, PackageX, ChevronRight, ShieldCheck } from "lucide-react";
import { PulseDot } from "@/components/motion/pulse-dot";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import type { AttentionItem } from "@/lib/data/dashboard";

/** Mini-lista de lo más urgente del día. Cada fila es clickeable. */
export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <div className="glass flex h-full flex-col rounded-2xl p-5 shadow-elev-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">
          Necesita atención hoy
        </h2>
        {items.length > 0 && (
          <span className="tabular rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <ShieldCheck className="h-8 w-8 text-success" />
          <p className="text-sm font-medium text-success">Todo al día</p>
          <p className="text-xs text-muted-foreground">
            No hay alertas urgentes ahora mismo.
          </p>
        </div>
      ) : (
        <Stagger className="mt-3 flex flex-col gap-2">
          {items.map((item) => {
            const Icon = item.kind === "expiry" ? CalendarClock : PackageX;
            return (
              <StaggerItem key={item.id}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background/60 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    <span className="absolute -right-0.5 -top-0.5">
                      <PulseDot tone={item.tone} />
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
