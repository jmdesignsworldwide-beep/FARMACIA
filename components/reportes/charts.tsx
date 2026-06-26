"use client";

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useReducedMotion } from "framer-motion";
import { useChartColors } from "./use-chart-colors";
import { formatRD } from "@/lib/utils";
import type { PuntoTiempo, BarItem, MetodoSlice, IngresoGasto } from "@/lib/data/reportes-shared";

function TipBox({ children }: { children: React.ReactNode }) {
  return <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-elev-2">{children}</div>;
}

const fmtK = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);

export function VentasTiempoChart({ data }: { data: PuntoTiempo[] }) {
  const c = useChartColors();
  const reduce = useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.primary} stopOpacity={0.5} />
            <stop offset="100%" stopColor={c.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
        <YAxis tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={fmtK} width={40} />
        <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
          <TipBox><p className="font-medium">{label}</p><p className="tabular text-primary">{formatRD(payload[0].value as number)}</p></TipBox>
        ) : null} />
        <Area type="monotone" dataKey="ventas" stroke={c.primary} strokeWidth={2.5} fill="url(#gVentas)" isAnimationActive={!reduce} animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MasVendidosChart({ data, onSelect }: { data: BarItem[]; onSelect?: (b: BarItem) => void }) {
  const c = useChartColors();
  const reduce = useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
        <XAxis type="number" tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="nombre" tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
        <Tooltip cursor={{ fill: c.grid }} content={({ active, payload }) => active && payload?.length ? (
          <TipBox><p className="font-medium">{payload[0].payload.nombre}</p><p className="tabular text-primary">{payload[0].value} uds</p></TipBox>
        ) : null} />
        <Bar dataKey="valor" radius={[0, 6, 6, 0]} isAnimationActive={!reduce} animationDuration={900}
          onClick={(d: any) => onSelect?.(d.payload)} cursor="pointer">
          {data.map((_, i) => <Cell key={i} fill={i % 2 ? c.accent : c.primary} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MetodosChart({ data, onSelect }: { data: MetodoSlice[]; onSelect?: (m: MetodoSlice) => void }) {
  const c = useChartColors();
  const reduce = useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} dataKey="valor" nameKey="metodo" cx="50%" cy="50%" innerRadius={55} outerRadius={88}
          paddingAngle={3} isAnimationActive={!reduce} animationDuration={900}
          onClick={(d: any) => onSelect?.(d.payload ?? d)} cursor="pointer">
          {data.map((_, i) => <Cell key={i} fill={c.palette[i % c.palette.length]} stroke={c.card} strokeWidth={3} />)}
        </Pie>
        <Tooltip content={({ active, payload }) => active && payload?.length ? (
          <TipBox><p className="font-medium">{payload[0].name}</p><p className="tabular">{payload[0].value}%</p></TipBox>
        ) : null} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function EmpleadosChart({ data }: { data: BarItem[] }) {
  const c = useChartColors();
  const reduce = useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="nombre" tick={{ fill: c.muted, fontSize: 10 }} tickLine={false} axisLine={false} interval={0} />
        <YAxis tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={fmtK} width={40} />
        <Tooltip cursor={{ fill: c.grid }} content={({ active, payload }) => active && payload?.length ? (
          <TipBox><p className="font-medium">{payload[0].payload.nombre}</p><p className="tabular text-primary">{formatRD(payload[0].value as number)}</p></TipBox>
        ) : null} />
        <Bar dataKey="valor" radius={[6, 6, 0, 0]} fill={c.accent} isAnimationActive={!reduce} animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function IngresosGastosChart({ data }: { data: IngresoGasto[] }) {
  const c = useChartColors();
  const reduce = useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={fmtK} width={40} />
        <Tooltip cursor={{ fill: c.grid }} content={({ active, payload, label }) => active && payload?.length ? (
          <TipBox>
            <p className="font-medium">{label}</p>
            {payload.map((p) => <p key={p.name} className="tabular" style={{ color: p.color }}>{p.name}: {formatRD(p.value as number)}</p>)}
          </TipBox>
        ) : null} />
        <Bar dataKey="ingresos" name="Ingresos" radius={[6, 6, 0, 0]} fill={c.primary} isAnimationActive={!reduce} animationDuration={800} />
        <Bar dataKey="gastos" name="Gastos" radius={[6, 6, 0, 0]} fill={c.danger} isAnimationActive={!reduce} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}
