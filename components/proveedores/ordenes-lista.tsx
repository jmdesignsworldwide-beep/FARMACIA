"use client";

import { useState } from "react";
import { ClipboardList, ChevronRight, Info, Package, Building2, CalendarClock } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatRD, cn } from "@/lib/utils";
import type { OrdenDemo } from "@/lib/data/compras-navegable";

const estadoCls: Record<string, string> = {
  borrador: "border-border bg-muted text-muted-foreground",
  enviada: "border-accent/30 bg-accent/10 text-accent",
  recibida: "border-success/30 bg-success/10 text-success",
};

export function OrdenesLista({ ordenes }: { ordenes: OrdenDemo[] }) {
  const [sel, setSel] = useState<OrdenDemo | null>(null);

  return (
    <>
      <Stagger className="space-y-2.5">
        {ordenes.map((o) => (
          <StaggerItem key={o.id}>
            <button onClick={() => setSel(o)} className="group block w-full text-left">
              <div className="glass flex items-center gap-3 rounded-2xl p-4 shadow-elev-1 transition-shadow hover:shadow-elev-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><ClipboardList className="h-[18px] w-[18px]" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold tracking-tight">{o.id}</span>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", estadoCls[o.estado])}>{o.estado}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{o.proveedor} · {o.items.length} productos · {o.fecha}</p>
                </div>
                <span className="tabular shrink-0 text-sm font-semibold">{formatRD(o.total)}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          </StaggerItem>
        ))}
      </Stagger>

      <Modal open={Boolean(sel)} onClose={() => setSel(null)} className="max-w-md">
        {sel && (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">Orden {sel.id}</h2>
              <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", estadoCls[sel.estado])}>{sel.estado}</span>
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" /> {sel.proveedor}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><CalendarClock className="h-4 w-4" /> {sel.fecha}</p>
            </div>

            <p className="mb-2 mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Package className="h-3.5 w-3.5" /> Productos</p>
            <ul className="space-y-1.5">
              {sel.items.map((it) => (
                <li key={it.nombre} className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{it.nombre}</span>
                  <span className="tabular shrink-0 text-muted-foreground">{it.cantidad} × {formatRD(it.costo)}</span>
                  <span className="tabular ml-3 shrink-0 font-medium">{formatRD(it.cantidad * it.costo)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-primary/25 bg-primary/8 px-3.5 py-2.5">
              <span className="text-sm font-medium">Total de la orden</span>
              <span className="tabular text-lg font-semibold text-primary">{formatRD(sel.total)}</span>
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" /> Orden de demostración. La emisión y recepción real se configuran en producción.
            </p>
            <Button onClick={() => setSel(null)} className="mt-4 w-full">Cerrar</Button>
          </>
        )}
      </Modal>
    </>
  );
}
