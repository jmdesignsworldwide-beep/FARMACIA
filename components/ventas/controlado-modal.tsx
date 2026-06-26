"use client";

import { useState } from "react";
import { ShieldAlert, Info } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export type RecetaDatos = { medico: string; paciente: string; numero: string };

/** Bloqueo FUERTE para medicamentos controlados: detiene la venta. */
export function ControladoModal({
  open,
  productoNombre,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  productoNombre?: string;
  onConfirm: (r: RecetaDatos) => void;
  onCancel: () => void;
}) {
  const [medico, setMedico] = useState("");
  const [paciente, setPaciente] = useState("");
  const [numero, setNumero] = useState("");
  const valido = medico.trim() && paciente.trim() && numero.trim();

  function confirmar() {
    if (!valido) return;
    onConfirm({ medico: medico.trim(), paciente: paciente.trim(), numero: numero.trim() });
    setMedico("");
    setPaciente("");
    setNumero("");
  }

  return (
    <Modal open={open} onClose={onCancel} tone="danger" dismissable={false}>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-danger/15 text-danger">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-danger">
            Medicamento controlado
          </h2>
          <p className="text-sm text-muted-foreground">
            {productoNombre ? <strong>{productoNombre}</strong> : "Este producto"} requiere registrar
            la receta antes de continuar. No se puede vender sin estos datos.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Field label="Médico que prescribe" required>
          <Input value={medico} onChange={(e) => setMedico(e.target.value)} placeholder="Dr(a). Nombre y apellido" autoFocus />
        </Field>
        <Field label="Paciente" required>
          <Input value={paciente} onChange={(e) => setPaciente(e.target.value)} placeholder="Nombre del paciente" />
        </Field>
        <Field label="Número de receta" required>
          <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ej. RX-2026-00123" />
        </Field>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          <strong>Funcionalidad de demostración.</strong> El libro de controlados y el reporte a las
          autoridades sanitarias se configuran en producción; este demo no constituye cumplimiento
          regulatorio real.
        </p>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={confirmar} disabled={!valido} className="bg-danger text-white hover:shadow-glow">
          Registrar y agregar
        </Button>
      </div>
    </Modal>
  );
}
