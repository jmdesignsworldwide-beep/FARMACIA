"use client";

import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, Save, Plus } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TIPOS_PROVEEDOR } from "@/lib/data/proveedores-shared";
import type { FormState } from "@/app/(app)/proveedores/actions";
import type { Proveedor } from "@/lib/data/proveedores-shared";

function SubmitBtn({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-40">
      {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
        : editing ? <><Save className="h-4 w-4" /> Guardar</> : <><Plus className="h-4 w-4" /> Registrar proveedor</>}
    </Button>
  );
}

export function ProveedorForm({
  action,
  proveedor,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  proveedor?: Proveedor;
}) {
  const [state, formAction] = useFormState(action, {} as FormState);
  const editing = Boolean(proveedor);

  return (
    <form action={formAction} className="space-y-6">
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Datos del proveedor</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" required className="sm:col-span-2">
            <Input name="nombre" defaultValue={proveedor?.nombre} placeholder="Ej. Distribuidora Corripio" required />
          </Field>
          <Field label="Tipo" required>
            <Select name="tipo" defaultValue={proveedor?.tipo ?? "distribuidor"}>
              {TIPOS_PROVEEDOR.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="RNC"><Input name="rnc" defaultValue={proveedor?.rnc ?? ""} placeholder="1-01-23456-7" /></Field>
          <Field label="Teléfono"><Input name="telefono" defaultValue={proveedor?.telefono ?? ""} placeholder="809-555-1234" /></Field>
          <Field label="Email"><Input name="email" type="email" defaultValue={proveedor?.email ?? ""} placeholder="ventas@proveedor.com" /></Field>
          <Field label="Dirección" className="sm:col-span-2"><Input name="direccion" defaultValue={proveedor?.direccion ?? ""} placeholder="Calle, sector, ciudad" /></Field>
          <Field label="Notas" className="sm:col-span-2"><Input name="notas" defaultValue={proveedor?.notas ?? ""} placeholder="Observaciones, condiciones de pago…" /></Field>
        </div>
      </section>

      {state.error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</motion.p>}
      <div className="flex justify-end"><SubmitBtn editing={editing} /></div>
    </form>
  );
}
