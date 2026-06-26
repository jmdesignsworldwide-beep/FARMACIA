"use client";

import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, Save, UserPlus } from "lucide-react";
import { Field, Input, Toggle } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/app/(app)/clientes/actions";
import type { Cliente } from "@/lib/data/clientes-shared";

function SubmitBtn({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-40">
      {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
        : editing ? <><Save className="h-4 w-4" /> Guardar</>
          : <><UserPlus className="h-4 w-4" /> Registrar cliente</>}
    </Button>
  );
}

export function ClienteForm({
  action,
  cliente,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  cliente?: Cliente;
}) {
  const [state, formAction] = useFormState(action, {} as FormState);
  const editing = Boolean(cliente);

  return (
    <form action={formAction} className="space-y-6">
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Datos del cliente</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" required className="sm:col-span-2">
            <Input name="nombre" defaultValue={cliente?.nombre} placeholder="Ej. Carmen Jiménez" required />
          </Field>
          <Field label="Cédula"><Input name="cedula" defaultValue={cliente?.cedula ?? ""} placeholder="001-1234567-8" /></Field>
          <Field label="Teléfono"><Input name="telefono" defaultValue={cliente?.telefono ?? ""} placeholder="809-555-1234" /></Field>
          <Field label="Fecha de nacimiento"><Input name="fecha_nacimiento" type="date" defaultValue={cliente?.fecha_nacimiento ?? ""} /></Field>
          <Field label="Balance (si debe, RD$)"><Input name="balance" type="number" step="0.01" defaultValue={cliente?.balance ?? 0} /></Field>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Salud y notas</h2>
        <div className="space-y-4">
          <Field label="Alergias registradas" hint="Sepáralas con comas. Ej. Penicilina, Sulfas">
            <Input name="alergias" defaultValue={cliente?.alergias.join(", ") ?? ""} placeholder="Penicilina, AINEs…" />
          </Field>
          <Field label="Notas internas"><Input name="notas" defaultValue={cliente?.notas ?? ""} placeholder="Observaciones" /></Field>
          <Toggle name="frecuente" label="Cliente frecuente" description="Resáltalo en listados y atención." defaultChecked={cliente?.frecuente} />
        </div>
      </section>

      {state.error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</motion.p>}
      <div className="flex justify-end"><SubmitBtn editing={editing} /></div>
    </form>
  );
}
