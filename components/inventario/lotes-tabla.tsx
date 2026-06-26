"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, Loader2, Check, X } from "lucide-react";
import { VencimientoBadge } from "./badges";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { registrarAjuste, type FormState } from "@/app/(app)/inventario/actions";
import type { Lote } from "@/lib/data/inventory";

function diasPara(fecha: string): number {
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000);
}

function AjusteSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      Guardar
    </Button>
  );
}

function LoteRow({ lote, productoId }: { lote: Lote; productoId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(registrarAjuste, {} as FormState);

  // Cierra el panel cuando el ajuste se guarda correctamente.
  if (state.ok && open) setOpen(false);

  return (
    <div className="rounded-xl border border-border/60 bg-card/40">
      <div className="flex flex-wrap items-center gap-3 p-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Lote {lote.numero_lote}</p>
          <p className="text-xs text-muted-foreground">
            {lote.proveedor ?? "Proveedor no indicado"} · entró el{" "}
            {new Date(lote.fecha_entrada).toLocaleDateString("es-DO")}
          </p>
        </div>
        <VencimientoBadge dias={diasPara(lote.fecha_vencimiento)} />
        <div className="text-right">
          <p className="tabular text-lg font-semibold leading-none">{lote.cantidad}</p>
          <p className="text-[11px] text-muted-foreground">unidades</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Ajustar stock del lote"
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            action={action}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/60"
          >
            <div className="flex flex-wrap items-end gap-3 p-3.5">
              <input type="hidden" name="lote_id" value={lote.id} />
              <input type="hidden" name="producto_id" value={productoId} />
              <label className="flex-1">
                <span className="mb-1 block text-xs text-muted-foreground">Nueva cantidad</span>
                <Input name="nueva_cantidad" type="number" min="0" step="1" defaultValue={lote.cantidad} required />
              </label>
              <label className="flex-[2]">
                <span className="mb-1 block text-xs text-muted-foreground">Motivo (opcional)</span>
                <Input name="motivo" placeholder="Ej. conteo físico, merma…" />
              </label>
              <AjusteSubmit />
            </div>
            {state.error && (
              <p className="px-3.5 pb-3 text-xs text-danger">{state.error}</p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LotesTabla({
  lotes,
  productoId,
}: {
  lotes: Lote[];
  productoId: string;
}) {
  if (lotes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center text-sm text-muted-foreground">
        Aún no hay lotes. Registra una entrada de mercancía para sumar stock.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {lotes.map((l) => (
        <LoteRow key={l.id} lote={l} productoId={productoId} />
      ))}
    </div>
  );
}
