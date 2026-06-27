"use client";

import { useState } from "react";
import { Undo2, Info, Paperclip, ChevronRight, Building2, CalendarClock, FileText } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Reveal } from "@/components/motion/reveal";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatRD, cn } from "@/lib/utils";
import type { Devolucion } from "@/lib/data/compras-navegable";

const estadoCls: Record<string, string> = {
  solicitada: "border-warning/30 bg-warning/10 text-warning",
  aceptada: "border-accent/30 bg-accent/10 text-accent",
  completada: "border-success/30 bg-success/10 text-success",
};

const FACTURAS_DEMO = [
  { id: "FC-9921", proveedor: "Distribuidora Corripio", fecha: "Hace 2 días", monto: 12450 },
  { id: "FC-9930", proveedor: "Bayer Dominicana", fecha: "Ayer", monto: 6400 },
  { id: "FC-9942", proveedor: "Merck RD", fecha: "Hoy", monto: 4200 },
];

export function DevolucionesLista({ devoluciones }: { devoluciones: Devolucion[] }) {
  const [sel, setSel] = useState<Devolucion | null>(null);
  const [facturas, setFacturas] = useState(false);

  return (
    <>
      <Stagger className="space-y-2.5">
        {devoluciones.map((d) => (
          <StaggerItem key={d.id}>
            <button onClick={() => setSel(d)} className="group block w-full text-left">
              <div className="glass flex items-center gap-3 rounded-2xl p-4 shadow-elev-1 transition-shadow hover:shadow-elev-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-danger/12 text-danger"><Undo2 className="h-[18px] w-[18px]" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold tracking-tight">{d.id}</span>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", estadoCls[d.estado])}>{d.estado}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{d.proveedor} · {d.motivo} · {d.fecha}</p>
                </div>
                <span className="tabular shrink-0 text-sm font-semibold">{formatRD(d.monto)}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Facturas de compra adjuntas (abre el panel de adjuntos) */}
      <Reveal>
        <button onClick={() => setFacturas(true)} className="group block w-full text-left">
          <div className="glass flex items-center gap-3 rounded-2xl p-4 shadow-elev-1 transition-shadow hover:shadow-elev-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground"><Paperclip className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">Facturas de compra adjuntas</p><p className="text-xs text-muted-foreground">Toca para ver los documentos adjuntos.</p></div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>
      </Reveal>

      {/* Modal detalle de devolución */}
      <Modal open={Boolean(sel)} onClose={() => setSel(null)} className="max-w-sm">
        {sel && (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">Devolución {sel.id}</h2>
              <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", estadoCls[sel.estado])}>{sel.estado}</span>
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" /> {sel.proveedor}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><CalendarClock className="h-4 w-4" /> {sel.fecha}</p>
              <p className="flex items-start gap-2 text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" /> Motivo: {sel.motivo}</p>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-danger/25 bg-danger/8 px-3.5 py-2.5">
              <span className="text-sm font-medium">Monto a devolver</span>
              <span className="tabular text-lg font-semibold text-danger">{formatRD(sel.monto)}</span>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" /> Flujo de devolución de demostración. La operación completa se configura en producción.</p>
            <Button onClick={() => setSel(null)} className="mt-4 w-full">Cerrar</Button>
          </>
        )}
      </Modal>

      {/* Modal facturas adjuntas */}
      <Modal open={facturas} onClose={() => setFacturas(false)} className="max-w-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Paperclip className="h-5 w-5 text-primary" /> Facturas adjuntas</h2>
        <p className="mt-1 text-sm text-muted-foreground">Documentos de compra vinculados a tus proveedores.</p>
        <ul className="mt-3 space-y-1.5">
          {FACTURAS_DEMO.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{f.id}</p><p className="truncate text-xs text-muted-foreground">{f.proveedor} · {f.fecha}</p></div>
              <span className="tabular shrink-0 font-medium">{formatRD(f.monto)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" /> Adjuntos de demostración. La carga real de PDFs se configura en producción.</p>
        <Button onClick={() => setFacturas(false)} className="mt-4 w-full">Cerrar</Button>
      </Modal>
    </>
  );
}
