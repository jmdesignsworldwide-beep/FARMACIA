"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, Bike, Contact, User } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Autocomplete } from "@/components/ui/autocomplete";
import { METODOS_PAGO } from "@/lib/data/ventas-shared";
import { crearDelivery, type FormState } from "@/app/(app)/deliveries/actions";
import { crearClienteRapido } from "@/app/(app)/clientes/actions";
import type { ClienteBasico } from "@/lib/data/clientes-shared";

type Motorista = { id: string; nombre: string };

function SubmitBtn() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" disabled={pending} className="min-w-40">{pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando…</> : <><Bike className="h-4 w-4" /> Crear delivery</>}</Button>;
}

export function DeliveryForm({ clientes, motoristas }: { clientes: ClienteBasico[]; motoristas: Motorista[] }) {
  const [state, action] = useFormState(crearDelivery, {} as FormState);
  const [clientesAll, setClientesAll] = useState(clientes);
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [motoristaId, setMotoristaId] = useState("");

  const motoristaNombre = motoristas.find((m) => m.id === motoristaId)?.nombre ?? "";

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <input type="hidden" name="motorista_nombre" value={motoristaNombre} />

      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Cliente y destino</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Cliente registrado">
            <Autocomplete
              kind="select"
              icon={Contact}
              placeholder="Buscar o crear cliente…"
              options={clientesAll.map((c) => ({ value: c.id, label: c.nombre, sub: c.cedula ?? undefined }))}
              onChange={(value, label) => { setClienteId(value); if (label) setClienteNombre(label); }}
              onCreate={async (texto) => {
                const r = await crearClienteRapido(texto);
                if (!r.ok || !r.id) return null;
                setClientesAll((prev) => [...prev, { id: r.id!, nombre: r.nombre!, cedula: null, alergias: [] }]);
                setClienteId(r.id);
                setClienteNombre(r.nombre!);
                return { value: r.id, label: r.nombre! };
              }}
            />
          </Field>
          <Field label="Nombre del cliente" required>
            <Input name="cliente_nombre" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Nombre" required />
          </Field>
          <Field label="Teléfono"><Input name="telefono" placeholder="809-555-1234" /></Field>
          <Field label="Sector"><Input name="sector" placeholder="Ej. Los Jardines, Santiago" /></Field>
          <Field label="Dirección" required className="sm:col-span-2"><Input name="direccion" placeholder="Calle, número, referencia" required /></Field>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Pedido y asignación</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Productos" className="sm:col-span-2"><Input name="detalle" placeholder="Ej. Amoxicilina, Vitaminas" /></Field>
          <Field label="Monto (RD$)"><Input name="monto" type="number" step="0.01" min="0" defaultValue="0" /></Field>
          <Field label="Método de pago">
            <Select name="metodo_pago" defaultValue="efectivo">
              {METODOS_PAGO.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
          </Field>
          <Field label="Motorista" className="sm:col-span-2">
            <input type="hidden" name="motorista_id" value={motoristaId} />
            <Autocomplete
              kind="select"
              icon={User}
              placeholder="Asignar motorista…"
              emptyText="Sin motoristas registrados"
              options={motoristas.map((m) => ({ value: m.id, label: m.nombre }))}
              onChange={(value) => setMotoristaId(value)}
            />
          </Field>
          <Field label="Notas" className="sm:col-span-2"><Input name="notas" placeholder="Indicaciones de entrega" /></Field>
        </div>
      </section>

      {state.error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</motion.p>}
      <div className="flex justify-end"><SubmitBtn /></div>
    </form>
  );
}
