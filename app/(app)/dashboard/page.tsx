import {
  TrendingUp,
  Package,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Magnetic } from "@/components/motion/magnetic";
import { CountUp } from "@/components/motion/count-up";
import { FillBar } from "@/components/motion/fill-bar";
import { PulseDot } from "@/components/motion/pulse-dot";
import { Reveal } from "@/components/motion/reveal";
import { Card, CardTitle } from "@/components/ui/card";

const KPIS = [
  {
    title: "Ventas de hoy",
    value: 48750.0,
    money: true,
    delta: "+12.4%",
    icon: TrendingUp,
    live: true,
  },
  {
    title: "Tickets de hoy",
    value: 213,
    money: false,
    delta: "+5.1%",
    icon: Receipt,
  },
  {
    title: "Productos en stock",
    value: 1846,
    money: false,
    delta: "98% disponible",
    icon: Package,
  },
  {
    title: "Por vencer (30 días)",
    value: 17,
    money: false,
    delta: "Requiere atención",
    icon: AlertTriangle,
    alert: true,
  },
];

const STOCK = [
  { label: "Analgésicos", value: 82 },
  { label: "Antibióticos", value: 64 },
  { label: "Vitaminas", value: 91 },
  { label: "Cuidado personal", value: 47 },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Panel general
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Una vista rápida del pulso de tu farmacia hoy.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground shadow-elev-1">
            <PulseDot tone="success" />
            En vivo
          </span>
        </div>
      </Reveal>

      {/* KPIs */}
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <StaggerItem key={kpi.title}>
              <Magnetic strength={0.18}>
                <Card glow={kpi.alert} className="h-full">
                  <div className="flex items-start justify-between">
                    <CardTitle>{kpi.title}</CardTitle>
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl ${
                        kpi.alert
                          ? "bg-warning/15 text-warning"
                          : "bg-primary/12 text-primary"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                  </div>
                  <p className="tabular mt-3 text-3xl font-semibold tracking-tight">
                    {kpi.money ? (
                      <CountUp value={kpi.value} currency />
                    ) : (
                      <CountUp value={kpi.value} />
                    )}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    {kpi.alert ? (
                      <span className="inline-flex items-center gap-1.5 text-warning">
                        <PulseDot tone="warning" />
                        {kpi.delta}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-success">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        {kpi.delta}
                      </span>
                    )}
                  </div>
                </Card>
              </Magnetic>
            </StaggerItem>
          );
        })}
      </Stagger>

      {/* Stock + Alertas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">
                Nivel de inventario por categoría
              </h2>
              <span className="text-xs text-muted-foreground">
                % de stock óptimo
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {STOCK.map((s) => (
                <FillBar key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="h-full">
            <h2 className="text-base font-semibold tracking-tight">
              Alertas
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <AlertRow
                tone="danger"
                title="3 productos agotados"
                sub="Reponer pronto"
              />
              <AlertRow
                tone="warning"
                title="17 lotes por vencer"
                sub="Próximos 30 días"
              />
              <AlertRow
                tone="primary"
                title="5 pedidos en camino"
                sub="Llegan esta semana"
              />
            </ul>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <p className="text-center text-xs text-muted-foreground">
          Datos de muestra para la demo · los módulos reales llegan en las
          próximas entregas.
        </p>
      </Reveal>
    </div>
  );
}

function AlertRow({
  tone,
  title,
  sub,
}: {
  tone: "danger" | "warning" | "primary";
  title: string;
  sub: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
      <PulseDot tone={tone} />
      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
    </li>
  );
}
