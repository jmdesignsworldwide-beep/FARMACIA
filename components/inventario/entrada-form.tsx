"use client";

import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, PackagePlus } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { registrarEntrada, type FormState } from "@/app/(app)/inventario/actions";

type ProductoOpcion = {
  id: string;
  nombre_comercial: string;
  nombre_generico: string;
  presentacion: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-44">
      {pending ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Registrando…</>
      ) : (
        <><PackagePlus className="h-4 w-4" /> Registrar entrada</>
      )}
    </Button>
  );
}

export function EntradaForm({
  productos,
  defaultProductoId,
}: {
  productos: ProductoOpcion[];
  defaultProductoId?: string;
}) {
  const [state, action] = useFormState(registrarEntrada, {} as FormState);

  return (
    <form action={action} className="space-y-6">
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Producto" required className="sm:col-span-2">
            <Select name="producto_id" defaultValue={defaultProductoId ?? ""} required>
              <option value="" disabled>Selecciona un producto…</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_comercial} — {p.nombre_generico}
                  {p.presentacion ? ` (${p.presentacion})` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Número de lote" required>
            <Input name="numero_lote" placeholder="Ej. A-2291" required />
          </Field>
          <Field label="Cantidad" required>
            <Input name="cantidad" type="number" min="1" step="1" placeholder="Ej. 50" required />
          </Field>
          <Field label="Fecha de vencimiento" required>
            <Input name="fecha_vencimiento" type="date" required />
          </Field>
          <Field label="Fecha de entrada">
            <Input name="fecha_entrada" type="date" />
          </Field>
          <Field label="Proveedor" className="sm:col-span-2">
            <Input name="proveedor" placeholder="Ej. Distribuidora Corripio" />
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
        <SubmitButton />
      </div>
    </form>
  );
}
