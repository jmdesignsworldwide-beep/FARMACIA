"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import { Field, Input, Toggle } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Autocomplete } from "@/components/ui/autocomplete";
import { CATEGORIAS } from "@/lib/data/categorias";
import { formatRD, cn } from "@/lib/utils";
import type { FormState } from "@/app/(app)/inventario/actions";
import type { Producto } from "@/lib/data/inventory";

/** Interruptor controlado (mismo look que Toggle, pero con estado para UI condicional). */
function Switch({ name, checked, onChange, label, description, tone = "primary" }: {
  name: string; checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; tone?: "primary" | "accent" | "danger";
}) {
  const toneOn = tone === "danger" ? "peer-checked:bg-danger" : tone === "accent" ? "peer-checked:bg-accent" : "peer-checked:bg-primary";
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/40 px-3.5 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className={cn("h-6 w-11 rounded-full bg-muted transition-colors", toneOn)} />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-elev-1 transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-40">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Guardando…
        </>
      ) : (
        <>
          <Save className="h-4 w-4" /> {label}
        </>
      )}
    </Button>
  );
}

export function ProductoForm({
  action,
  producto,
  defaultCodigo,
  laboratorios = [],
  submitLabel = "Guardar producto",
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  producto?: Producto;
  defaultCodigo?: string;
  laboratorios?: string[];
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, {} as FormState);
  const [costo, setCosto] = useState(producto?.precio_costo ?? 0);
  const [venta, setVenta] = useState(producto?.precio_venta ?? 0);
  const [vendeUnidad, setVendeUnidad] = useState(producto?.vende_unidad ?? true);
  const [vendeCaja, setVendeCaja] = useState(producto?.vende_caja ?? false);
  const [upc, setUpc] = useState(producto?.unidades_por_caja ?? 1);
  const [precioCaja, setPrecioCaja] = useState(producto?.precio_caja ?? 0);

  const margen =
    costo > 0 ? ((venta - costo) / costo) * 100 : 0;
  const ganancia = venta - costo;
  const costoCaja = costo * Math.max(1, upc);
  const margenCaja = costoCaja > 0 ? ((precioCaja - costoCaja) / costoCaja) * 100 : 0;

  return (
    <form action={formAction} className="space-y-6">
      {/* Identificación */}
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Identificación</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre comercial" required>
            <Input name="nombre_comercial" defaultValue={producto?.nombre_comercial} placeholder="Ej. Panadol" required />
          </Field>
          <Field label="Nombre genérico" required>
            <Input name="nombre_generico" defaultValue={producto?.nombre_generico} placeholder="Ej. Acetaminofén" required />
          </Field>
          <Field label="Laboratorio">
            <Autocomplete kind="text" name="laboratorio" placeholder="Ej. GSK"
              options={laboratorios.map((l) => ({ value: l, label: l }))}
              defaultValue={producto?.laboratorio ?? ""} />
          </Field>
          <Field label="Categoría" required>
            <Autocomplete kind="text" name="categoria" required placeholder="Ej. Analgésicos"
              options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
              defaultValue={producto?.categoria ?? "Analgésicos"} />
          </Field>
          <Field label="Concentración">
            <Input name="concentracion" defaultValue={producto?.concentracion ?? ""} placeholder="Ej. 500 mg" />
          </Field>
          <Field label="Presentación">
            <Input name="presentacion" defaultValue={producto?.presentacion ?? ""} placeholder="Ej. Caja 20 tabletas" />
          </Field>
          <Field label="Código de barras" className="sm:col-span-2">
            <Input name="codigo_barras" defaultValue={producto?.codigo_barras ?? defaultCodigo ?? ""} placeholder="Ej. 7460010012345" inputMode="numeric" />
          </Field>
        </div>
      </section>

      {/* Precios */}
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Precios (RD$)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Precio de costo" required>
            <Input name="precio_costo" type="number" step="0.01" min="0" required
              defaultValue={producto?.precio_costo ?? ""}
              onChange={(e) => setCosto(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Precio por unidad" required>
            <Input name="precio_venta" type="number" step="0.01" min="0" required
              defaultValue={producto?.precio_venta ?? ""}
              onChange={(e) => setVenta(Number(e.target.value) || 0)} />
          </Field>
          <div className="rounded-xl border border-border/70 bg-card/40 px-3.5 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">Margen por unidad</span>
            <p className="tabular mt-1 text-lg font-semibold">
              <span className={margen >= 0 ? "text-success" : "text-danger"}>
                {margen.toFixed(1)}%
              </span>
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {formatRD(ganancia)} / unidad
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Presentación de venta (caja / detallado) */}
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="text-sm font-semibold tracking-tight">Presentación de venta</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          El stock se lleva siempre en <strong>unidades</strong>. La caja es un múltiplo de unidades.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Switch name="vende_unidad" checked={vendeUnidad} onChange={setVendeUnidad}
            label="Se vende detallado (por unidad)" description="Venta suelta, por pieza" tone="accent" />
          <Switch name="vende_caja" checked={vendeCaja} onChange={setVendeCaja}
            label="Se vende por caja" description="Producto completo" tone="primary" />
        </div>

        {vendeCaja && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Unidades por caja" required>
              <Input name="unidades_por_caja" type="number" min="2" step="1" required
                value={upc} onChange={(e) => setUpc(Math.trunc(Number(e.target.value)) || 1)} placeholder="Ej. 20" />
            </Field>
            <Field label="Precio por caja" required>
              <Input name="precio_caja" type="number" min="0" step="0.01" required
                value={precioCaja || ""} onChange={(e) => setPrecioCaja(Number(e.target.value) || 0)} placeholder="RD$ 0.00" />
            </Field>
            <div className="rounded-xl border border-border/70 bg-card/40 px-3.5 py-2.5">
              <span className="text-xs font-medium text-muted-foreground">1 caja = {Math.max(1, upc)} uds · margen caja</span>
              <p className="tabular mt-1 text-lg font-semibold">
                <span className={margenCaja >= 0 ? "text-success" : "text-danger"}>{margenCaja.toFixed(1)}%</span>
              </p>
            </div>
          </motion.div>
        )}
      </section>

      {/* Control y stock */}
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Control y stock</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Toggle name="controlado" tone="danger" label="Medicamento controlado"
            description="Requiere control especial" defaultChecked={producto?.controlado} />
          <Toggle name="requiere_receta" tone="accent" label="Requiere receta médica"
            description="No se vende sin receta" defaultChecked={producto?.requiere_receta} />
          <Field label="Stock mínimo (umbral de alerta)" required className="sm:col-span-2 sm:max-w-xs">
            <Input name="stock_minimo" type="number" min="0" step="1" required
              defaultValue={producto?.stock_minimo ?? 0} />
          </Field>
        </div>
      </section>

      {state.error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </motion.p>
      )}

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
