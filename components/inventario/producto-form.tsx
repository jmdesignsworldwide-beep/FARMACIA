"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import { Field, Input, Select, Toggle } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { CATEGORIAS } from "@/lib/data/categorias";
import { formatRD } from "@/lib/utils";
import type { FormState } from "@/app/(app)/inventario/actions";
import type { Producto } from "@/lib/data/inventory";

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
  submitLabel = "Guardar producto",
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  producto?: Producto;
  defaultCodigo?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, {} as FormState);
  const [costo, setCosto] = useState(producto?.precio_costo ?? 0);
  const [venta, setVenta] = useState(producto?.precio_venta ?? 0);

  const margen =
    costo > 0 ? ((venta - costo) / costo) * 100 : 0;
  const ganancia = venta - costo;

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
            <Input name="laboratorio" defaultValue={producto?.laboratorio ?? ""} placeholder="Ej. GSK" />
          </Field>
          <Field label="Categoría" required>
            <Select name="categoria" defaultValue={producto?.categoria ?? "Analgésicos"}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
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
          <Field label="Precio de venta" required>
            <Input name="precio_venta" type="number" step="0.01" min="0" required
              defaultValue={producto?.precio_venta ?? ""}
              onChange={(e) => setVenta(Number(e.target.value) || 0)} />
          </Field>
          <div className="rounded-xl border border-border/70 bg-card/40 px-3.5 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">Margen (calculado)</span>
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
