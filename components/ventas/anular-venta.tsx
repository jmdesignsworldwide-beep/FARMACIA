"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Ban, Loader2, Info } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { anularVenta, type FormState } from "@/app/(app)/ventas/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-danger text-white hover:shadow-glow">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
      Anular venta
    </Button>
  );
}

export function AnularVenta({ ventaId, folio }: { ventaId: string; folio: number }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(anularVenta, {} as FormState);

  if (state.ok && open) setOpen(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-danger">
        <Ban className="h-4 w-4" /> Anular
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} className="max-w-md">
        <h2 className="text-lg font-semibold tracking-tight">Anular venta #{folio}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          El stock vuelve a sus lotes y queda registrado quién anuló y por qué.
        </p>
        <form action={action} className="mt-4 space-y-3">
          <input type="hidden" name="venta_id" value={ventaId} />
          <Field label="Motivo de la anulación" required>
            <Input name="motivo" placeholder="Ej. cliente devolvió el producto" autoFocus required />
          </Field>
          <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Queda registrado para el historial de empleados (se amplía en una próxima entrega).</p>
          </div>
          {state.error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Submit />
          </div>
        </form>
      </Modal>
    </>
  );
}
