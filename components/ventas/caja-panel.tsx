"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import {
  Wallet, LockKeyhole, Unlock, TrendingDown, Loader2, Plus, Banknote,
} from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/motion/count-up";
import { abrirCaja, registrarEgreso, cerrarCaja, type FormState } from "@/app/(app)/ventas/actions";
import { metodoLabel, type Caja, type CajaResumen, type EgresoRow } from "@/lib/data/ventas-shared";
import { formatRD } from "@/lib/utils";

function Submit({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}

export function CajaPanel({
  caja,
  resumen,
  egresos,
}: {
  caja: Caja | null;
  resumen: CajaResumen | null;
  egresos: EgresoRow[];
}) {
  if (!caja || !resumen) return <Apertura />;
  return <CajaAbierta caja={caja} resumen={resumen} egresos={egresos} />;
}

function Apertura() {
  const [state, action] = useFormState(abrirCaja, {} as FormState);
  return (
    <div className="mx-auto max-w-md">
      <div className="glass rounded-2xl p-6 text-center shadow-elev-2">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/12 text-primary">
          <Wallet className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Abrir caja</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra el monto inicial (fondo) para empezar el turno.
        </p>
        <form action={action} className="mt-5 space-y-4 text-left">
          <Field label="Monto inicial (RD$)" required>
            <Input name="monto_inicial" type="number" min="0" step="0.01" defaultValue="2000" required autoFocus />
          </Field>
          {state.error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>}
          <Submit className="w-full"><Unlock className="h-4 w-4" /> Abrir caja</Submit>
        </form>
      </div>
    </div>
  );
}

function CajaAbierta({ caja, resumen, egresos }: { caja: Caja; resumen: CajaResumen; egresos: EgresoRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Resumen */}
      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Fondo inicial" value={caja.monto_inicial} />
          <Stat label="Ventas" value={resumen.totalVentas} sub={`${resumen.ventasCount} tickets`} />
          <Stat label="Egresos" value={resumen.totalEgresos} tone="danger" />
          <Stat label="Efectivo esperado" value={resumen.efectivoEsperado} tone="primary" />
        </div>

        <div className="glass rounded-2xl p-5 shadow-elev-1">
          <h3 className="mb-3 text-sm font-semibold tracking-tight">Ingresos por método</h3>
          <div className="space-y-2">
            {["efectivo", "transferencia", "tarjeta_debito", "tarjeta_credito"].map((m) => (
              <div key={m} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{metodoLabel(m)}</span>
                <span className="tabular font-medium">{formatRD(resumen.porMetodo[m] ?? 0)}</span>
              </div>
            ))}
          </div>
        </div>

        <Egresos cajaId={caja.id} egresos={egresos} />
      </div>

      {/* Cierre */}
      <Cierre esperado={resumen.efectivoEsperado} />
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: number; sub?: string; tone?: "primary" | "danger" }) {
  return (
    <div className="glass rounded-2xl p-4 shadow-elev-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`tabular mt-1 text-xl font-semibold tracking-tight ${tone === "danger" ? "text-danger" : tone === "primary" ? "text-primary" : ""}`}>
        <CountUp value={value} currency />
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Egresos({ cajaId, egresos }: { cajaId: string; egresos: EgresoRow[] }) {
  const [state, action] = useFormState(registrarEgreso, {} as FormState);
  return (
    <div className="glass rounded-2xl p-5 shadow-elev-1">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight">
        <TrendingDown className="h-4 w-4 text-danger" /> Egresos
      </h3>
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="caja_id" value={cajaId} />
        <label className="w-28">
          <span className="mb-1 block text-xs text-muted-foreground">Monto</span>
          <Input name="monto" type="number" min="0" step="0.01" placeholder="RD$" required />
        </label>
        <label className="min-w-40 flex-1">
          <span className="mb-1 block text-xs text-muted-foreground">Motivo</span>
          <Input name="motivo" placeholder="Ej. pago a mensajero" required />
        </label>
        <Submit><Plus className="h-4 w-4" /> Agregar</Submit>
      </form>
      {state.error && <p className="mt-2 text-xs text-danger">{state.error}</p>}

      {egresos.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {egresos.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/40 px-3 py-2 text-sm">
              <span className="truncate text-muted-foreground">{e.motivo}</span>
              <span className="tabular shrink-0 font-medium text-danger">− {formatRD(e.monto)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Cierre({ esperado }: { esperado: number }) {
  const [state, action] = useFormState(cerrarCaja, {} as FormState);
  const [contado, setContado] = useState<number>(0);
  const diferencia = contado - esperado;

  return (
    <div className="glass h-fit rounded-2xl p-5 shadow-elev-2 lg:sticky lg:top-20">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
        <LockKeyhole className="h-4 w-4" /> Cierre de caja (arqueo)
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">Cuenta el efectivo físico y compáralo con lo esperado.</p>

      <div className="mb-3 flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground"><Banknote className="h-4 w-4" /> Esperado</span>
        <span className="tabular font-semibold">{formatRD(esperado)}</span>
      </div>

      <form action={action} className="space-y-3">
        <Field label="Efectivo contado (RD$)" required>
          <Input name="monto_contado" type="number" min="0" step="0.01" value={contado || ""} onChange={(e) => setContado(Number(e.target.value) || 0)} required />
        </Field>

        {contado > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${Math.abs(diferencia) < 0.01 ? "bg-success/10 text-success" : diferencia > 0 ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"}`}>
            <span>Diferencia</span>
            <span className="tabular font-semibold">{diferencia >= 0 ? "+" : ""}{formatRD(diferencia)}</span>
          </motion.div>
        )}

        <Field label="Notas (opcional)">
          <Input name="notas" placeholder="Observaciones del cierre" />
        </Field>

        {state.error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>}
        <Submit className="w-full"><LockKeyhole className="h-4 w-4" /> Cerrar caja</Submit>
      </form>
    </div>
  );
}
