import { Reveal } from "@/components/motion/reveal";
import { PulseDot } from "@/components/motion/pulse-dot";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { AttentionList } from "@/components/dashboard/attention-list";
import { DaySummary } from "@/components/dashboard/day-summary";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const today = new Date().toLocaleDateString("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Panel general
            </h1>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {today}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground shadow-elev-1">
            <PulseDot tone="success" />
            En vivo
          </span>
        </div>
      </Reveal>

      {/* Los 4 KPIs grandes que respiran */}
      <KpiGrid data={data} />

      {/* Accesos rápidos */}
      <Reveal>
        <QuickActions />
      </Reveal>

      {/* Sección secundaria: atención + resumen */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <AttentionList items={data.attention} />
        </Reveal>
        <Reveal delay={0.1}>
          <DaySummary summary={data.daySummary} />
        </Reveal>
      </div>

      <Reveal>
        <p className="text-center text-xs text-muted-foreground">
          Datos de muestra · al activar POS e Inventario, el panel leerá de la
          fuente real automáticamente.
        </p>
      </Reveal>
    </div>
  );
}
