"use client";

import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, Save, UserPlus } from "lucide-react";
import { Field, Input, Select, Toggle } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/auth/roles";
import type { FormState } from "@/app/(app)/empleados/actions";
import type { Empleado } from "@/lib/data/empleados";

function SubmitBtn({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-44">
      {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
        : editing ? <><Save className="h-4 w-4" /> Guardar cambios</>
          : <><UserPlus className="h-4 w-4" /> Crear empleado</>}
    </Button>
  );
}

export function EmpleadoForm({
  action,
  empleado,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  empleado?: Empleado;
}) {
  const [state, formAction] = useFormState(action, {} as FormState);
  const editing = Boolean(empleado);

  return (
    <form action={formAction} className="space-y-6">
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Datos del empleado</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" required className="sm:col-span-2">
            <Input name="full_name" defaultValue={empleado?.full_name ?? ""} placeholder="Ej. María Pérez Rodríguez" required />
          </Field>
          <Field label="Cédula">
            <Input name="cedula" defaultValue={empleado?.cedula ?? ""} placeholder="001-1234567-8" />
          </Field>
          <Field label="Teléfono">
            <Input name="telefono" defaultValue={empleado?.telefono ?? ""} placeholder="809-555-1234" />
          </Field>
          <Field label="Cargo">
            <Input name="cargo" defaultValue={empleado?.cargo ?? ""} placeholder="Ej. Farmacéutica" />
          </Field>
          <Field label="Turno">
            <Select name="turno" defaultValue={empleado?.turno ?? "Mañana"}>
              <option>Mañana</option>
              <option>Tarde</option>
              <option>Noche</option>
              <option>Completo</option>
            </Select>
          </Field>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Rol y acceso</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Rol" required className="sm:col-span-2">
            <Select name="rol" defaultValue={empleado?.rol ?? "cajero"} required>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </Field>

          {!editing && (
            <>
              <Field label="Usuario" required hint="Lo usará para entrar (solo letras, números, . _ -)">
                <Input name="username" placeholder="ej. maria" autoCapitalize="none" required />
              </Field>
              <Field label="Contraseña" required hint="Mínimo 6 caracteres">
                <Input name="password" type="text" placeholder="Contraseña inicial" required />
              </Field>
            </>
          )}

          {editing && (
            <div className="sm:col-span-2">
              <Toggle name="activo" label="Empleado activo" description="Si se desactiva, no podrá operar." defaultChecked={empleado?.activo} />
            </div>
          )}
        </div>
      </section>

      {state.error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{state.error}</motion.p>
      )}

      <div className="flex justify-end"><SubmitBtn editing={editing} /></div>
    </form>
  );
}
