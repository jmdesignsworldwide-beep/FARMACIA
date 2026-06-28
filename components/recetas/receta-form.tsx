"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, ShieldAlert, Loader2, Paperclip, FileCheck2, Save, Info } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Autocomplete } from "@/components/ui/autocomplete";
import { crearReceta, type FormState } from "@/app/(app)/recetas/actions";
import type { ProductoReceta } from "@/lib/data/recetas-shared";

type Item = {
  producto_id: string | null;
  nombre_medicamento: string;
  cantidad: number;
  indicaciones: string;
  controlado: boolean;
};

function PendingDot() {
  const { pending } = useFormStatus();
  return pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />;
}

export function RecetaForm({ productos, medicos = [], pacientes = [] }: { productos: ProductoReceta[]; medicos?: string[]; pacientes?: string[] }) {
  const [state, action] = useFormState(crearReceta, {} as FormState);
  const formRef = useRef<HTMLFormElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [sel, setSel] = useState("");
  const [cant, setCant] = useState(1);
  const [indic, setIndic] = useState("");
  const [adjunto, setAdjunto] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const controlada = items.some((i) => i.controlado);

  function agregar() {
    const p = productos.find((x) => x.id === sel);
    if (!p) return;
    setItems((prev) => [
      ...prev,
      {
        producto_id: p.id,
        nombre_medicamento: `${p.nombre_comercial} (${p.nombre_generico})`,
        cantidad: Math.max(1, cant),
        indicaciones: indic.trim(),
        controlado: p.controlado,
      },
    ]);
    setSel(""); setCant(1); setIndic("");
  }

  function submitReal() {
    setConfirm(false);
    formRef.current?.requestSubmit();
  }

  function intentarGuardar() {
    if (items.length === 0) return;
    if (controlada) setConfirm(true);
    else submitReal();
  }

  return (
    <form ref={formRef} action={action} className="space-y-6">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="foto_url" value={adjunto ? "demo://receta-adjunta" : ""} />

      {/* Médico y paciente */}
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Médico y paciente</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Número de receta"><Input name="numero" placeholder="Ej. RX-2026-0123" /></Field>
          <Field label="Fecha"><Input name="fecha" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
          <Field label="Médico" required>
            <Autocomplete kind="text" name="medico_nombre" required placeholder="Dr(a). Nombre"
              options={medicos.map((m) => ({ value: m, label: m }))} />
          </Field>
          <Field label="Colegiatura (exequátur)"><Input name="medico_colegiatura" placeholder="Ej. CMD-12345" /></Field>
          <Field label="Paciente" required>
            <Autocomplete kind="text" name="paciente_nombre" required placeholder="Nombre del paciente"
              options={pacientes.map((p) => ({ value: p, label: p }))} />
          </Field>
          <Field label="Cédula del paciente"><Input name="paciente_cedula" placeholder="001-1234567-8" /></Field>
        </div>
      </section>

      {/* Medicamentos */}
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Medicamentos recetados</h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-44 flex-1">
            <span className="mb-1 block text-xs text-muted-foreground">Producto del catálogo</span>
            <Select value={sel} onChange={(e) => setSel(e.target.value)}>
              <option value="">Selecciona…</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre_comercial} — {p.nombre_generico}{p.controlado ? " ⚠ controlado" : ""}</option>
              ))}
            </Select>
          </label>
          <label className="w-24">
            <span className="mb-1 block text-xs text-muted-foreground">Cantidad</span>
            <Input type="number" min="1" value={cant} onChange={(e) => setCant(Number(e.target.value) || 1)} />
          </label>
          <label className="min-w-40 flex-1">
            <span className="mb-1 block text-xs text-muted-foreground">Indicaciones</span>
            <Input value={indic} onChange={(e) => setIndic(e.target.value)} placeholder="Ej. 1 cada 8h" />
          </label>
          <Button type="button" variant="outline" onClick={agregar} disabled={!sel}><Plus className="h-4 w-4" /> Agregar</Button>
        </div>

        {items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {items.map((it, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {it.cantidad}× {it.nombre_medicamento}
                    {it.controlado && <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger"><ShieldAlert className="h-2.5 w-2.5" /> Controlado</span>}
                  </p>
                  {it.indicaciones && <p className="text-xs text-muted-foreground">{it.indicaciones}</p>}
                </div>
                <button type="button" onClick={() => setItems((p) => p.filter((_, x) => x !== i))} className="text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Adjunto (navegable) + notas */}
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight">Foto / escaneo de la receta</h2>
          <Button type="button" variant="outline" onClick={() => setAdjunto((v) => !v)}>
            {adjunto ? <><FileCheck2 className="h-4 w-4" /> Adjunta</> : <><Paperclip className="h-4 w-4" /> Adjuntar</>}
          </Button>
        </div>
        {adjunto && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4">
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-primary"><FileCheck2 className="h-7 w-7" /></div>
            <div>
              <p className="text-sm font-medium">receta_adjunta.jpg</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Info className="h-3 w-3" /> Vista de demostración — la captura real se habilita en producción.</p>
            </div>
          </div>
        )}
        <div className="mt-4"><Field label="Notas"><Input name="notas" placeholder="Observaciones de la receta" /></Field></div>
      </section>

      {state.error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</motion.p>}

      <div className="flex items-center justify-end gap-3">
        {controlada && <span className="flex items-center gap-1.5 text-xs text-danger"><ShieldAlert className="h-4 w-4" /> Incluye controlado — requiere verificación</span>}
        <Button type="button" size="lg" onClick={intentarGuardar} disabled={items.length === 0} className="min-w-44">
          <PendingDot /> Registrar receta
        </Button>
      </div>

      {/* Doble verificación de controlados */}
      <Modal open={confirm} onClose={() => setConfirm(false)} tone="danger" className="max-w-md">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-danger/15 text-danger"><ShieldAlert className="h-6 w-6" /></span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-danger">Verificación de controlado</h2>
            <p className="mt-1 text-sm text-muted-foreground">Esta receta incluye un medicamento <strong>controlado</strong>. Confirma que los datos del médico, paciente y número de receta son correctos antes de asentarla.</p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Funcionalidad de demostración. El cumplimiento regulatorio real se configura en producción.</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setConfirm(false)}>Revisar</Button>
          <Button type="button" onClick={submitReal} className="bg-danger text-white hover:shadow-glow">Confirmar y registrar</Button>
        </div>
      </Modal>
    </form>
  );
}
