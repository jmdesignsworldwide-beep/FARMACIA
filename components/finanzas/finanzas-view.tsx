"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Coins, Wallet,
  Package, Moon, Sparkles, Info, ChevronRight, Banknote, Bike, Store,
  PiggyBank, Percent, CalendarRange, ShoppingBag, BadgePercent, Lightbulb, LineChart, Minus,
} from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Magnetic } from "@/components/motion/magnetic";
import { CountUp } from "@/components/motion/count-up";
import { PulseDot } from "@/components/motion/pulse-dot";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FitText } from "@/components/ui/fit-text";
import { IngresosEgresosChart, ComposicionChart } from "./charts";
import { useChartColors } from "@/components/reportes/use-chart-colors";
import { formatRD, cn } from "@/lib/utils";
import { PERIODOS, type FinanzasData, type Tendencia } from "@/lib/data/finanzas-shared";

type Panel = "entradas" | "salidas" | "ganancia" | null;

export function FinanzasView({ data }: { data: FinanzasData }) {
  const router = useRouter();
  const colors = useChartColors();
  const [panel, setPanel] = useState<Panel>(null);
  const [custom, setCustom] = useState(false);
  const [desde, setDesde] = useState(data.desde);
  const [hasta, setHasta] = useState(data.hasta);

  const sube = data.tendenciaPct >= 0;

  function aplicarCustom() {
    if (desde && hasta) router.push(`/finanzas?periodo=custom&desde=${desde}&hasta=${hasta}`);
  }

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <Reveal>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-border/70 bg-card/40 p-1">
            {PERIODOS.map((p) => (
              <Link key={p.value} href={`/finanzas?periodo=${p.value}`}
                className={cn("rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                  data.periodo === p.value ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-elev-1" : "text-muted-foreground hover:text-foreground")}>
                {p.label}
              </Link>
            ))}
            <button onClick={() => setCustom((s) => !s)}
              className={cn("flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                data.periodo === "custom" ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-elev-1" : "text-muted-foreground hover:text-foreground")}>
              <CalendarRange className="h-4 w-4" /> Personalizado
            </button>
          </div>
          {(custom || data.periodo === "custom") && (
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                className="rounded-xl border border-input bg-card/50 px-3 py-2 text-sm outline-none focus:border-ring" />
              <span className="text-sm text-muted-foreground">→</span>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                className="rounded-xl border border-input bg-card/50 px-3 py-2 text-sm outline-none focus:border-ring" />
              <Button size="sm" onClick={aplicarCustom}>Aplicar</Button>
            </div>
          )}
        </div>
      </Reveal>

      {data.esDemo && (
        <Reveal>
          <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-2.5 text-xs text-accent">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>El <strong>flujo</strong> (entró/salió/ganancia) está poblado con datos de muestra de un mes próspero; se llena con <strong>tus ventas reales</strong> al operar. El <strong>patrimonio</strong> (valor de inventario, plata en caja, capital dormido) ya es <strong>real</strong>.</p>
          </div>
        </Reveal>
      )}

      {/* ── LA FOTO ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Ganancia real — la reina */}
        <Reveal className="lg:col-span-1 lg:order-2">
          <button onClick={() => setPanel("ganancia")} className="group block w-full text-left">
            <Card glow className="relative h-full overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-accent/10">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Coins className="h-4 w-4" /> Ganancia real
                  </span>
                  <TrendBadge t={data.tendencias.ganancia} />
                </div>
                <FitText className="mt-3" textClassName="tabular bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                  <CountUp value={data.ganancia} currency />
                </FitText>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  Ventas menos el costo de lo vendido · margen {data.margenPct}%
                  <TrendBadge t={data.tendencias.margen} unit="pts" size="xs" />
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Ver cómo se calcula <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Card>
          </button>
        </Reveal>

        {/* Entró */}
        <Reveal delay={0.05} className="lg:order-1">
          <FotoCard tone="success" icon={ArrowDownToLine} label="Entró" sub="Ingresos del período"
            value={data.entro} trend={data.tendencias.entro} onClick={() => setPanel("entradas")} />
        </Reveal>

        {/* Salió */}
        <Reveal delay={0.1} className="lg:order-3">
          <FotoCard tone="danger" icon={ArrowUpFromLine} label="Salió" sub="Egresos del período"
            value={data.salio} trend={data.tendencias.salio} onClick={() => setPanel("salidas")} />
        </Reveal>
      </div>

      {sube && data.tendenciaPct > 0 && (
        <Reveal>
          <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Ganaste <strong className="text-foreground">{data.tendenciaPct}% más</strong> que el período anterior. ¡Buen ritmo!
          </p>
        </Reveal>
      )}

      {/* ── PROYECCIÓN (mirada al futuro) ── */}
      {data.proyeccion && (
        <Reveal>
          <Card className="relative overflow-hidden border-accent/30 bg-gradient-to-br from-accent/10 via-card to-primary/5">
            <div className="absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-accent/10 blur-2xl" />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent"><LineChart className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-semibold tracking-tight">Proyección de cierre de mes</p>
                  <p className="text-xs text-muted-foreground">
                    A este ritmo ({data.proyeccion.pctMes}% del mes transcurrido), cerrarías cerca de:
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div>
                  <p className="text-[11px] text-muted-foreground">Ventas</p>
                  <FitText textClassName="tabular text-xl font-bold tracking-tight"><CountUp value={data.proyeccion.ventas} currency /></FitText>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Ganancia</p>
                  <FitText textClassName="tabular text-xl font-bold tracking-tight text-primary"><CountUp value={data.proyeccion.ganancia} currency /></FitText>
                </div>
              </div>
            </div>
            <p className="relative mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
              <Info className="h-3 w-3 shrink-0" /> Estimación al ritmo actual, no un cierre definitivo.
            </p>
          </Card>
        </Reveal>
      )}

      {/* ── PATRIMONIO ── */}
      <Reveal>
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <PiggyBank className="h-4 w-4 text-primary" /> El patrimonio
          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success"><PulseDot tone="success" /> Real</span>
        </h2>
        <Insight text={data.insights.patrimonio} />
      </Reveal>
      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PatrimonioCard icon={Package} tone="primary" label="Valor del inventario hoy" value={data.valorInventario}
          hint="La plata parada en tus estantes, a precio de costo." />
        <PatrimonioCard icon={Wallet} tone="accent" label="Plata en caja" value={data.plataEnCaja}
          hint="Efectivo esperado en la caja abierta." />
        <PatrimonioCard icon={Moon} tone="warning" label="Capital dormido" value={data.capitalDormido}
          hint={`${data.dormidoCount} producto${data.dormidoCount === 1 ? "" : "s"} sin venta en 60 días.`} />
      </Stagger>

      {/* ── SALUD DEL NEGOCIO ── */}
      <Reveal>
        <h2 className="flex items-center gap-2 pt-1 text-base font-semibold tracking-tight">
          <TrendingUp className="h-4 w-4 text-primary" /> Salud del negocio
        </h2>
      </Reveal>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Card className="h-full">
            <h3 className="mb-3 text-sm font-semibold tracking-tight">Ingresos vs egresos en el tiempo</h3>
            <IngresosEgresosChart data={data.serie} />
            <div className="mt-1 flex justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.primary }} /> Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.danger }} /> Egresos</span>
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full">
            <h3 className="mb-1 text-sm font-semibold tracking-tight">Composición de ingresos</h3>
            <ComposicionChart data={data.porMetodo} onSelect={() => setPanel("entradas")} />
            <div className="mt-2 space-y-1">
              {data.porMetodo.map((m, i) => (
                <div key={m.metodo} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.palette[i % colors.palette.length] }} />{m.metodo}
                  </span>
                  <span className="tabular font-medium">{m.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight"><BadgePercent className="h-4 w-4 text-success" /> Más rentables</h3>
            <Insight text={data.insights.rentable} className="mb-3 mt-1" />
            <RentList items={data.masRentables} tone="success" />
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight"><Percent className="h-4 w-4 text-warning" /> Menor margen</h3>
            <RentList items={data.menosRentables} tone="warning" />
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" /> Toca cualquier número grande para ver el detalle que lo compone.
        </p>
      </Reveal>

      {/* ── PANELES DE DETALLE (clic = más info) ── */}
      <Modal open={panel === "entradas"} onClose={() => setPanel(null)} className="max-w-md">
        <PanelHeader icon={ArrowDownToLine} tone="success" titulo="Entradas — de dónde viene la plata"
          monto={data.entro} />
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Por método de pago</p>
            <div className="space-y-1.5">
              {data.porMetodo.map((m) => (
                <Linea key={m.metodo} label={m.metodo} value={m.monto} extra={`${m.pct}%`} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Por canal</p>
            <Linea label="Mostrador" value={data.mostrador} icon={Store} />
            <Linea label="Delivery" value={data.delivery} icon={Bike} />
          </div>
          {data.ventasDetalle.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ventas que la componen ({data.ventasCount})</p>
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {data.ventasDetalle.slice(0, 30).map((v) => (
                  <li key={v.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-sm">
                    <span className="text-muted-foreground">Folio #{v.folio}</span>
                    <span className="tabular font-medium">{formatRD(v.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.esDemo && <DemoNota />}
        </div>
        <Button onClick={() => setPanel(null)} className="mt-5 w-full">Entendido</Button>
      </Modal>

      <Modal open={panel === "salidas"} onClose={() => setPanel(null)} className="max-w-md">
        <PanelHeader icon={ArrowUpFromLine} tone="danger" titulo="Salidas — a dónde se va la plata"
          monto={data.salio} />
        <Insight text={data.insights.salidas} className="mt-2" />
        <div className="mt-4 space-y-4">
          <Linea label="Compras a proveedores" value={data.compras} icon={ShoppingBag} fuerte />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gastos operativos</p>
            <div className="space-y-1.5">
              {data.gastos.map((g) => <Linea key={g.categoria} label={g.categoria} value={g.monto} />)}
            </div>
          </div>
          {data.gastosDetalle.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detalle de egresos</p>
              <ul className="max-h-44 space-y-1 overflow-y-auto">
                {data.gastosDetalle.slice(0, 30).map((g, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-sm">
                    <span className="truncate pr-2 text-muted-foreground">{g.motivo}</span>
                    <span className="tabular font-medium text-danger">−{formatRD(g.monto)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.esDemo && <DemoNota />}
        </div>
        <Button onClick={() => setPanel(null)} className="mt-5 w-full">Entendido</Button>
      </Modal>

      <Modal open={panel === "ganancia"} onClose={() => setPanel(null)} className="max-w-md">
        <PanelHeader icon={Coins} tone="primary" titulo="Ganancia real" monto={data.ganancia} />
        <div className="mt-4 space-y-2">
          <Linea label="Ventas (entró)" value={data.entro} icon={Banknote} />
          <Linea label="Costo de lo vendido" value={-(data.entro - data.ganancia)} icon={Package} />
          <div className="my-1 border-t border-border/60" />
          <Linea label="Ganancia real" value={data.ganancia} fuerte />
          <div className="mt-3 rounded-xl border border-primary/25 bg-primary/8 px-3.5 py-2.5 text-xs text-muted-foreground">
            Tu margen real es <strong className="text-primary">{data.margenPct}%</strong>. Es lo que de verdad ganas
            después de pagar el costo de la mercancía vendida — no lo facturado.
          </div>
          {data.esDemo && <DemoNota />}
        </div>
        <Button onClick={() => setPanel(null)} className="mt-5 w-full">Entendido</Button>
      </Modal>
    </div>
  );
}

// ── Subcomponentes ───────────────────────────────────────────────

function FotoCard({ tone, icon: Icon, label, sub, value, trend, onClick }: {
  tone: "success" | "danger"; icon: typeof ArrowDownToLine; label: string; sub: string; value: number; trend?: Tendencia; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="group block h-full w-full text-left">
      <Card className="h-full transition-shadow group-hover:shadow-elev-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-[11px] text-muted-foreground/70">{sub}</p>
          </div>
          <span className={cn("grid h-9 w-9 place-items-center rounded-xl",
            tone === "success" ? "bg-success/12 text-success" : "bg-danger/12 text-danger")}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <FitText className="mt-3" textClassName="tabular text-3xl font-semibold tracking-tight"><CountUp value={value} currency /></FitText>
        <div className="mt-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
            Ver detalle <ChevronRight className="h-3.5 w-3.5" />
          </span>
          {trend && <TrendBadge t={trend} size="xs" />}
        </div>
      </Card>
    </button>
  );
}

/** Badge de tendencia ↑↓ con color por concepto (mejor = verde, peor = ámbar). */
function TrendBadge({ t, unit = "%", size = "sm" }: { t: Tendencia; unit?: string; size?: "xs" | "sm" }) {
  const plano = t.pct === 0;
  const Icon = plano ? Minus : t.pct > 0 ? TrendingUp : TrendingDown;
  const cls = plano ? "bg-muted text-muted-foreground" : t.mejor ? "bg-success/12 text-success" : "bg-warning/12 text-warning";
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full font-semibold",
      cls, size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs")}>
      <Icon className={size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {t.pct > 0 ? "+" : ""}{t.pct}{unit === "pts" ? " pts" : "%"}
      <span className="font-normal opacity-70">vs antes</span>
    </span>
  );
}

/** Línea de insight en cristiano (premium, no texto plano). */
function Insight({ text, className }: { text: string; className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 text-xs leading-snug text-muted-foreground", className)}>
      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
      <span>{text}</span>
    </p>
  );
}

function PatrimonioCard({ icon: Icon, tone, label, value, hint }: {
  icon: typeof Package; tone: "primary" | "accent" | "warning"; label: string; value: number; hint: string;
}) {
  const toneCls = tone === "primary" ? "bg-primary/12 text-primary" : tone === "accent" ? "bg-accent/12 text-accent" : "bg-warning/12 text-warning";
  return (
    <StaggerItem>
      <Magnetic strength={0.12}>
        <Card className="h-full">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <span className={cn("grid h-8 w-8 place-items-center rounded-lg", toneCls)}><Icon className="h-4 w-4" /></span>
          </div>
          <FitText className="mt-2" textClassName="tabular text-2xl font-semibold tracking-tight"><CountUp value={value} currency /></FitText>
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{hint}</p>
        </Card>
      </Magnetic>
    </StaggerItem>
  );
}

function RentList({ items, tone }: { items: FinanzasData["masRentables"]; tone: "success" | "warning" }) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Sin datos de productos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((p) => (
        <li key={p.productoId ?? p.nombre}>
          <Link href={p.productoId ? `/inventario/${p.productoId}` : "#"}
            className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2 transition-colors hover:bg-muted">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.nombre}</p>
              <p className="text-xs text-muted-foreground">Costo {formatRD(p.costo)} · Venta {formatRD(p.venta)}</p>
            </div>
            <span className={cn("tabular rounded-full px-2 py-0.5 text-xs font-semibold",
              tone === "success" ? "bg-success/12 text-success" : "bg-warning/12 text-warning")}>
              {p.margenPct}%
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PanelHeader({ icon: Icon, tone, titulo, monto }: {
  icon: typeof Coins; tone: "success" | "danger" | "primary"; titulo: string; monto: number;
}) {
  const toneCls = tone === "success" ? "bg-success/12 text-success" : tone === "danger" ? "bg-danger/12 text-danger" : "bg-primary/12 text-primary";
  return (
    <div className="flex items-center gap-3">
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", toneCls)}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold tracking-tight">{titulo}</h2>
        <FitText textClassName="tabular text-2xl font-bold tracking-tight"><CountUp value={monto} currency /></FitText>
      </div>
    </div>
  );
}

function Linea({ label, value, extra, icon: Icon, fuerte }: {
  label: string; value: number; extra?: string; icon?: typeof Store; fuerte?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between rounded-lg px-3 py-2",
      fuerte ? "border border-primary/25 bg-primary/8" : "border border-border/60 bg-card/40")}>
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}{label}
      </span>
      <span className="flex items-center gap-2">
        {extra && <span className="text-xs text-muted-foreground">{extra}</span>}
        <span className={cn("tabular font-semibold", fuerte && "text-primary")}>{formatRD(value)}</span>
      </span>
    </div>
  );
}

function DemoNota() {
  return (
    <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
      <Info className="mt-0.5 h-3 w-3 shrink-0" /> Cifras de muestra; se reemplazan por tus ventas reales al operar.
    </p>
  );
}
