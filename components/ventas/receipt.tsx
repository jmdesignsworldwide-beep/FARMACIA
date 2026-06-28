"use client";

import { CheckCircle2, Info, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/motion/count-up";
import { formatRD } from "@/lib/utils";
import { metodoLabel, type VentaItem } from "@/lib/data/ventas-shared";

export type ReciboData = {
  folio: number;
  total: number;
  cambio: number;
  metodo: string;
  items: VentaItem[];
};

const fmtVenc = (d: string) =>
  new Date(d).toLocaleDateString("es-DO", { month: "short", year: "numeric" });

/** Recibo digital de EJEMPLO tras cobrar. */
export function Receipt({
  data,
  onClose,
}: {
  data: ReciboData | null;
  onClose: () => void;
}) {
  return (
    <Modal open={Boolean(data)} onClose={onClose} className="max-w-md">
      {data && (
        <>
          <div className="flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">Venta completada</h2>
            <p className="text-sm text-muted-foreground">
              Recibo <span className="tabular font-medium">#{data.folio}</span> ·{" "}
              {metodoLabel(data.metodo)}
            </p>
          </div>

          <div className="mt-5 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border/60 bg-card/40 p-3">
            {data.items.map((it) => (
              <div key={it.id} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">
                    {it.cantidad}× {it.nombre_producto}
                    {it.presentacion && <span className="ml-1 text-[11px] font-normal text-muted-foreground">· {it.presentacion}</span>}
                  </span>
                  <span className="tabular shrink-0">{formatRD(it.subtotal)}</span>
                </div>
                {it.lotes_usados.map((l) => (
                  <p key={l.lote_id} className="text-[11px] text-muted-foreground">
                    ↳ Lote {l.numero_lote} · vence {fmtVenc(l.fecha_vencimiento)} · {l.cantidad} uds
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5">
            <Row label="Total" value={formatRD(data.total)} strong />
            {data.metodo === "efectivo" && (
              <Row label="Cambio" value={formatRD(data.cambio)} accent />
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Documento de ejemplo generado para demostración.</p>
          </div>

          <Button onClick={onClose} size="lg" className="mt-5 w-full">
            <Plus className="h-4 w-4" /> Nueva venta
          </Button>
        </>
      )}
    </Modal>
  );
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`tabular ${strong ? "text-lg font-semibold" : "text-sm font-medium"} ${
          accent ? "text-success" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
