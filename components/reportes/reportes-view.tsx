"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, Receipt, Wallet, BarChart3, Printer, Info, Sparkles,
  CalendarClock, PackageX, ShieldAlert, Bike, ChevronRight, Star,
} from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Magnetic } from "@/components/motion/magnetic";
import { CountUp } from "@/components/motion/count-up";
import { PulseDot } from "@/components/motion/pulse-dot";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { VencimientoBadge } from "@/components/inventario/badges";
import {
  VentasTiempoChart, MasVendidosChart, MetodosChart, EmpleadosChart, IngresosGastosChart,
} from "./charts";
import { useChartColors } from "./use-chart-colors";
import { formatRD, cn } from "@/lib/utils";
import type { ReportesData, BarItem, MetodoSlice } from "@/lib/data/reportes-shared";

const PERIODOS = [
  { value: "dia", label: "Día" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
];

export function ReportesView({ data }: { data: ReportesData }) {
  const colors = useChartColors();
  const [empleadoSel, setEmpleadoSel] = useState("");
  const [desglose, setDesglose] = useState<{ titulo: string; detalle: string } | null>(null);

  const empleados = data.porEmpleado.map((e) => e.nombre);
  const porEmpleado = empleadoSel ? data.porEmpleado.filter((e) => e.nombre === empleadoSel) : data.porEmpleado;

  return (
    <div className="space-y-6">
      {/* Filtros + exportar */}
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-xl border border-border/70 bg-card/40 p-1">
              {PERIODOS.map((p) => (
                <Link key={p.value} href={`/reportes?periodo=${p.value}`}
                  className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    data.periodo === p.value ? "bg-gradient-to-r from-primary to-accent text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {p.label}
                </Link>
              ))}
            </div>
            <select value={empleadoSel} onChange={(e) => setEmpleadoSel(e.target.value)}
              className="rounded-xl border border-input bg-card/50 px-3 py-2 text-sm outline-none focus:border-ring">
              <option value="">Todos los empleados</option>
              {empleados.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Exportar / imprimir</Button>
        </div>
      </Reveal>

      {data.esDemo && (
        <Reveal>
          <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-2.5 text-xs text-accent">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Vista poblada con datos de muestra para la demostración. Los mismos gráficos se llenan con <strong>tus ventas reales</strong> a medida que el negocio opera. <em>Por vencer</em> y <em>bajo stock</em> ya leen del inventario real.</p>
          </div>
        </Reveal>
      )}

      {/* KPIs */}
      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={TrendingUp} label="Ingresos del período" value={data.kpis.ingresos} currency />
        <Kpi icon={Receipt} label="Ventas" value={data.kpis.ventas} />
        <Kpi icon={BarChart3} label="Ticket promedio" value={data.kpis.ticket} currency />
        <Kpi icon={Wallet} label="Utilidad estimada" value={data.kpis.utilidad} currency />
      </Stagger>

      {/* Ventas en el tiempo */}
      <Reveal>
        <Card>
          <h2 className="mb-3 text-base font-semibold tracking-tight">Ventas en el tiempo</h2>
          <VentasTiempoChart data={data.ventasTiempo} />
        </Card>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <h2 className="mb-3 text-base font-semibold tracking-tight">Más vendidos</h2>
            <MasVendidosChart data={data.masVendidos} onSelect={(b: BarItem) => setDesglose({ titulo: b.nombre, detalle: `${b.valor} unidades vendidas en el período.` })} />
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full">
            <h2 className="mb-3 text-base font-semibold tracking-tight">Por método de pago</h2>
            <MetodosChart data={data.porMetodo} onSelect={(m: MetodoSlice) => setDesglose({ titulo: m.metodo, detalle: `${m.valor}% de las ventas del período.` })} />
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {data.porMetodo.map((m, i) => (
                <span key={m.metodo} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.palette[i % colors.palette.length] }} />
                  {m.metodo} · {m.valor}%
                </span>
              ))}
            </div>
          </Card>
        </Reveal>
        <Reveal>
          <Card className="h-full">
            <h2 className="mb-3 text-base font-semibold tracking-tight">Ventas por empleado</h2>
            <EmpleadosChart data={porEmpleado} />
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full">
            <h2 className="mb-3 text-base font-semibold tracking-tight">Ingresos vs gastos</h2>
            <IngresosGastosChart data={data.ingresosGastos} />
          </Card>
        </Reveal>
      </div>

      {/* Reales: por vencer + bajo stock */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight"><CalendarClock className="h-4 w-4 text-warning" /> Próximos a vencer</h2>
              <RealBadge />
            </div>
            <ListaReal items={data.porVencer.map((p) => ({
              href: `/inventario/${p.productoId}`, titulo: `${p.nombre} · ${p.lote}`,
              sub: `${p.cantidad} uds`, right: <VencimientoBadge dias={p.dias} />,
            }))} vacio="Nada por vencer en 90 días." />
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight"><PackageX className="h-4 w-4 text-warning" /> Bajo stock</h2>
              <RealBadge />
            </div>
            <ListaReal items={data.bajoStock.map((p) => ({
              href: `/inventario/${p.productoId}`, titulo: p.nombre,
              sub: `mínimo ${p.minimo}`, right: <span className="tabular text-sm font-semibold text-warning">{p.stock} uds</span>,
            }))} vacio="Stock saludable." />
          </Card>
        </Reveal>
      </div>

      {/* Clientes frecuentes + controlados + deliveries */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal>
          <Card className="h-full">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight"><Star className="h-4 w-4 text-primary" /> Clientes frecuentes</h2>
            <ol className="space-y-2">
              {data.clientesFrecuentes.map((c, i) => (
                <li key={c.nombre} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2">
                  <span className="tabular grid h-6 w-6 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary">{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{c.nombre}</p><p className="text-xs text-muted-foreground">{c.compras} compras</p></div>
                  <span className="tabular text-sm font-semibold">{formatRD(c.monto)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight"><ShieldAlert className="h-4 w-4 text-danger" /> Controlados despachados</h2>
            <div className="space-y-3">
              <ResumenLinea label="Despachos asentados" value={data.controlados.totalDespachos} />
              <ResumenLinea label="Unidades" value={data.controlados.totalUnidades} />
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" /> Demostración. El reporte real a autoridades se configura en producción.</p>
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="h-full">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight"><Bike className="h-4 w-4 text-accent" /> Deliveries</h2>
            <div className="space-y-3">
              <ResumenLinea label="Pendientes" value={data.deliveries.pendientes} dot="warning" />
              <ResumenLinea label="En camino" value={data.deliveries.enCamino} dot="primary" />
              <ResumenLinea label="Entregados" value={data.deliveries.entregados} dot="success" />
            </div>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" /> Al exportar/imprimir se genera un documento de ejemplo para demostración.
        </p>
      </Reveal>

      {/* Desglose (patrón monster) */}
      <Modal open={Boolean(desglose)} onClose={() => setDesglose(null)} className="max-w-sm">
        {desglose && (
          <>
            <h2 className="text-lg font-semibold tracking-tight">{desglose.titulo}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{desglose.detalle}</p>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" /> El desglose completo por fecha y empleado se habilita con el histórico real.</p>
            <Button onClick={() => setDesglose(null)} className="mt-4 w-full">Entendido</Button>
          </>
        )}
      </Modal>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, currency }: { icon: typeof TrendingUp; label: string; value: number; currency?: boolean }) {
  return (
    <StaggerItem>
      <Magnetic strength={0.14}>
        <Card className="h-full">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/12 text-primary"><Icon className="h-4 w-4" /></span>
          </div>
          <p className="tabular mt-2 text-2xl font-semibold tracking-tight"><CountUp value={value} currency={currency} /></p>
        </Card>
      </Magnetic>
    </StaggerItem>
  );
}

function RealBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success"><PulseDot tone="success" /> Datos reales</span>;
}

function ListaReal({ items, vacio }: { items: { href: string; titulo: string; sub: string; right: React.ReactNode }[]; vacio: string }) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{vacio}</p>;
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i}>
          <Link href={it.href} className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2 transition-colors hover:bg-muted">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{it.titulo}</p><p className="text-xs text-muted-foreground">{it.sub}</p></div>
            {it.right}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ResumenLinea({ label, value, dot }: { label: string; value: number; dot?: "warning" | "primary" | "success" }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">{dot && <PulseDot tone={dot} />}{label}</span>
      <span className="tabular text-lg font-semibold"><CountUp value={value} /></span>
    </div>
  );
}
