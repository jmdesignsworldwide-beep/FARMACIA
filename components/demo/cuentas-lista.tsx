"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, Clock, Power, RefreshCw, Loader2, CalendarClock, Crown, User } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { CountUp } from "@/components/motion/count-up";
import { PulseDot } from "@/components/motion/pulse-dot";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { renovarCuentaDemo, toggleCuentaDemo } from "@/app/(app)/demo/actions";
import { diasRestantes, estadoVigencia, VIGENCIA_META, type DemoAcceso } from "@/lib/data/demo-acceso-shared";
import { cn } from "@/lib/utils";

function fecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}

export function CuentasLista({ cuentas }: { cuentas: DemoAcceso[] }) {
  const [renovar, setRenovar] = useState<DemoAcceso | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function aplicarRenovar(dias: number) {
    if (!renovar) return;
    startTransition(async () => {
      const r = await renovarCuentaDemo(renovar.id, dias);
      if (r.error) setError(r.error);
      else { setError(null); setRenovar(null); }
    });
  }

  function aplicarToggle(c: DemoAcceso) {
    startTransition(async () => {
      const r = await toggleCuentaDemo(c.id, !c.activo);
      if (r.error) setError(r.error);
    });
  }

  if (cuentas.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Aún no has creado cuentas de cliente.</p>;
  }

  return (
    <>
      {error && <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
      <Stagger className="space-y-2.5">
        {cuentas.map((c) => {
          const estado = estadoVigencia(c);
          const meta = VIGENCIA_META[estado];
          const dias = diasRestantes(c.vence_at);
          return (
            <StaggerItem key={c.id}>
              <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    c.es_admin_demo ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground")}>
                    {c.es_admin_demo ? <Crown className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold tracking-tight">{c.username}</p>
                      {c.es_admin_demo ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <ShieldCheck className="h-3 w-3" /> Admin del demo
                        </span>
                      ) : (
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", meta.cls)}>
                          <PulseDot tone={meta.dot} /> {meta.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Creada {fecha(c.created_at)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Vence {fecha(c.vence_at)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                  {!c.es_admin_demo && c.vence_at && (
                    <div className="text-right">
                      <p className={cn("tabular text-2xl font-bold leading-none",
                        estado === "vencida" ? "text-danger" : estado === "por_vencer" ? "text-warning" : "text-foreground")}>
                        <CountUp value={Math.max(dias ?? 0, dias && dias < 0 ? dias : 0)} />
                      </p>
                      <p className="text-[10px] text-muted-foreground">{(dias ?? 0) < 0 ? "días vencida" : "días restantes"}</p>
                    </div>
                  )}
                  {!c.es_admin_demo && (
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => { setError(null); setRenovar(c); }} disabled={pending}>
                        <RefreshCw className="h-4 w-4" /> Renovar
                      </Button>
                      <Button variant={c.activo ? "ghost" : "outline"} size="sm" onClick={() => aplicarToggle(c)} disabled={pending}
                        title={c.activo ? "Desactivar" : "Activar"}>
                        <Power className={cn("h-4 w-4", c.activo ? "text-success" : "text-muted-foreground")} />
                        <span className="hidden sm:inline">{c.activo ? "Activa" : "Inactiva"}</span>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </StaggerItem>
          );
        })}
      </Stagger>

      {/* Modal renovar */}
      <Modal open={Boolean(renovar)} onClose={() => !pending && setRenovar(null)} className="max-w-sm">
        {renovar && (
          <>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <RefreshCw className="h-5 w-5 text-primary" /> Renovar acceso
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Suma días al acceso de <strong className="text-foreground">{renovar.username}</strong>. Parte de su fecha actual si aún está vigente.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[7, 15, 30].map((d) => (
                <button key={d} onClick={() => aplicarRenovar(d)} disabled={pending}
                  className="rounded-xl border border-border/70 bg-card/40 py-3 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary disabled:opacity-50">
                  {pending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : <>+{d} días</>}
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setRenovar(null)} disabled={pending} className="mt-4 w-full">Cancelar</Button>
          </>
        )}
      </Modal>
    </>
  );
}
