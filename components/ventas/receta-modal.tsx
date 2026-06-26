"use client";

import { FileText } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

/** Aviso SUAVE: requiere receta (no controlado). Deja continuar tras confirmar. */
export function RecetaModal({
  open,
  productoNombre,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  productoNombre?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} className="max-w-md">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
          <FileText className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Requiere receta médica</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {productoNombre ? <strong>{productoNombre}</strong> : "Este producto"} se vende con receta.
            ¿El cliente la presentó?
          </p>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>No, cancelar</Button>
        <Button onClick={onConfirm} className="bg-accent text-accent-foreground hover:shadow-glow">
          Sí, continuar
        </Button>
      </div>
    </Modal>
  );
}
