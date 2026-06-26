import Link from "next/link";
import { BookLock, Boxes, Pill, Clock, Repeat, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { FillBar } from "@/components/motion/fill-bar";
import { PulseDot } from "@/components/motion/pulse-dot";
import { Card, CardTitle } from "@/components/ui/card";
import { RecetasNav } from "@/components/recetas/recetas-nav";
import { DisclaimerControlados } from "@/components/recetas/disclaimer";
import { requireCapability } from "@/lib/auth/guard";
import { getControladosReporte } from "@/lib/data/recetas";
import { diasDesde } from "@/lib/data/recetas-shared";

export const dynamic = "force-dynamic";

export default async function ReportesControladosPage() {
  await requireCapability("ver_controlados");
  const rep = await getControladosReporte();
  const maxUnidades = Math.max(1, ...rep.porProducto.map((p) => p.unidades));

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reportes de controlados</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resumen de despachos y alertas de recetas.</p>
      </Reveal>

      <RecetasNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat icon={BookLock} label="Despachos asentados" value={rep.totalDespachos} />
        <Stat icon={Pill} label="Unidades despachadas" value={rep.totalUnidades} />
        <Stat icon={Boxes} label="Productos controlados" value={rep.porProducto.length} />
      </div>

      <Reveal>
        <Card>
          <h2 className="text-base font-semibold tracking-tight">Despachos por producto</h2>
          <div className="mt-4 space-y-4">
            {rep.porProducto.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay despachos asentados.</p>
            ) : rep.porProducto.map((p) => (
              <FillBar key={p.nombre} label={`${p.nombre} · ${p.despachos} despachos`} value={p.unidades} max={maxUnidades} />
            ))}
          </div>
        </Card>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recetas vencidas */}
        <Reveal>
          <Card className="h-full">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight"><Clock className="h-4 w-4 text-warning" /> Recetas vencidas</h2>
            {rep.recetasVencidas.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No hay recetas vencidas pendientes.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {rep.recetasVencidas.map((r) => (
                  <li key={r.id}>
                    <Link href={`/recetas/${r.id}`} className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 transition-colors hover:bg-muted">
                      <PulseDot tone="warning" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.paciente_nombre} · #{r.numero}</p>
                        <p className="truncate text-xs text-muted-foreground">Vencida hace {diasDesde(r.fecha) - 30} días</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>

        {/* Control de repetidas (navegable) */}
        <Reveal delay={0.1}>
          <Card className="h-full">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight"><Repeat className="h-4 w-4 text-accent" /> Control de recetas repetidas</h2>
            <p className="mt-2 text-sm text-muted-foreground">El sistema marca cuando una misma receta intenta despacharse más de una vez.</p>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success"><Repeat className="h-4 w-4" /></span>
              <div><p className="text-sm font-medium">Sin repeticiones detectadas</p><p className="text-xs text-muted-foreground">Vigilancia activa sobre los números de receta.</p></div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Detección avanzada disponible en la versión de producción.</p>
          </Card>
        </Reveal>
      </div>

      <Reveal><DisclaimerControlados /></Reveal>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Pill; label: string; value: number }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <CardTitle>{label}</CardTitle>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary"><Icon className="h-[18px] w-[18px]" /></span>
      </div>
      <p className="tabular mt-2 text-3xl font-semibold tracking-tight"><CountUp value={value} /></p>
    </Card>
  );
}
