"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, PackagePlus, Info } from "lucide-react";
import { Truck } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Autocomplete } from "@/components/ui/autocomplete";
import { ScanButton } from "@/components/scanner/scan-button";
import { registrarEntrada, type FormState } from "@/app/(app)/inventario/actions";
import { crearProveedorRapido } from "@/app/(app)/proveedores/actions";
import type { ProveedorBasico } from "@/lib/data/proveedores-shared";

type ProductoOpcion = {
  id: string;
  nombre_comercial: string;
  nombre_generico: string;
  presentacion: string | null;
  codigo_barras: string | null;
  unidades_por_caja: number;
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
  proveedores,
  defaultProductoId,
}: {
  productos: ProductoOpcion[];
  proveedores: ProveedorBasico[];
  defaultProductoId?: string;
}) {
  const [state, action] = useFormState(registrarEntrada, {} as FormState);
  const [proveedoresAll, setProveedoresAll] = useState(proveedores);
  const [proveedorId, setProveedorId] = useState("");
  const [productoId, setProductoId] = useState(defaultProductoId ?? "");
  const [noEncontrado, setNoEncontrado] = useState<string | null>(null);
  const [cant, setCant] = useState<number>(0);
  const [entradaModo, setEntradaModo] = useState<"unidad" | "caja">("unidad");
  const proveedorNombre = proveedoresAll.find((p) => p.id === proveedorId)?.nombre ?? "";

  const upc = productos.find((p) => p.id === productoId)?.unidades_por_caja ?? 1;
  const porCaja = entradaModo === "caja" && upc > 1;
  const unidadesTotales = porCaja ? cant * upc : cant;

  function onScan(codigo: string) {
    const prod = productos.find((p) => p.codigo_barras === codigo);
    if (prod) {
      setProductoId(prod.id);
      setNoEncontrado(null);
    } else {
      setNoEncontrado(codigo);
    }
  }

  return (
    <form action={action} className="space-y-6">
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Producto" required className="sm:col-span-2">
            <div className="flex gap-2">
              <Select name="producto_id" value={productoId} onChange={(e) => setProductoId(e.target.value)} required className="flex-1">
                <option value="" disabled>Selecciona un producto…</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_comercial} — {p.nombre_generico}
                    {p.presentacion ? ` (${p.presentacion})` : ""}
                  </option>
                ))}
              </Select>
              <ScanButton onDetected={onScan} />
            </div>
            {noEncontrado && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>No hay un producto con el código <strong>{noEncontrado}</strong>.</span>
                <Link href={`/inventario/nuevo?codigo=${noEncontrado}`} className="font-semibold underline">Crearlo</Link>
              </div>
            )}
          </Field>

          <Field label="Número de lote" required>
            <Input name="numero_lote" placeholder="Ej. A-2291" required />
          </Field>
          <Field label={porCaja ? "Cantidad (cajas)" : "Cantidad (unidades)"} required>
            {/* Lo que se guarda en el stock siempre es en UNIDADES. */}
            <input type="hidden" name="cantidad" value={unidadesTotales || ""} />
            <div className="flex gap-2">
              <Input type="number" min="1" step="1" required placeholder="Ej. 50" value={cant || ""}
                onChange={(e) => setCant(Math.max(0, Math.trunc(Number(e.target.value)) || 0))} className="flex-1" />
              {upc > 1 && (
                <Select value={entradaModo} onChange={(e) => setEntradaModo(e.target.value as "unidad" | "caja")} className="w-32">
                  <option value="unidad">Unidades</option>
                  <option value="caja">Cajas</option>
                </Select>
              )}
            </div>
            {porCaja && cant > 0 && (
              <p className="mt-1 text-[11px] text-primary">= {unidadesTotales} unidades al stock ({cant} × {upc})</p>
            )}
          </Field>
          <Field label="Fecha de vencimiento" required>
            <Input name="fecha_vencimiento" type="date" required />
          </Field>
          <Field label="Fecha de entrada">
            <Input name="fecha_entrada" type="date" />
          </Field>
          <Field label="Proveedor" className="sm:col-span-2">
            <input type="hidden" name="proveedor_id" value={proveedorId} />
            <input type="hidden" name="proveedor" value={proveedorNombre} />
            <Autocomplete
              kind="select"
              icon={Truck}
              placeholder="Escribe para buscar o crear un proveedor…"
              options={proveedoresAll.map((p) => ({ value: p.id, label: p.nombre }))}
              onChange={(value) => setProveedorId(value)}
              onCreate={async (texto) => {
                const r = await crearProveedorRapido(texto);
                if (!r.ok || !r.id) return null;
                setProveedoresAll((prev) => [...prev, { id: r.id!, nombre: r.nombre! }]);
                setProveedorId(r.id);
                return { value: r.id, label: r.nombre! };
              }}
            />
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
