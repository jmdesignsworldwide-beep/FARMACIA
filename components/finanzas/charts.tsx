"use client";

import {
  ResponsiveContainer, ComposedChart, Area, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useReducedMotion } from "framer-motion";
import { useChartColors } from "@/components/reportes/use-chart-colors";
import { formatRD } from "@/lib/utils";
import type { SerieFin, MetodoBreak } from "@/lib/data/finanzas-shared";

function TipBox({ children }: { children: React.ReactNode }) {
  return <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-elev-2">{children}</div>;
}
const fmtK = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);

/** Ingresos (área) vs egresos (barras) en el tiempo. */
export function IngresosEgresosChart({ data }: { data: SerieFin[] }) {
  const c = useChartColors();
  const reduce = useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gIngreso" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.primary} stopOpacity={0.45} />
            <stop offset="100%" stopColor={c.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
        <YAxis tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={fmtK} width={40} />
        <Tooltip cursor={{ fill: c.grid }} content={({ active, payload, label }) => active && payload?.length ? (
          <TipBox>
            <p className="font-medium">{label}</p>
            {payload.map((p) => <p key={p.name} className="tabular" style={{ color: p.color }}>{p.name}: {formatRD(p.value as number)}</p>)}
          </TipBox>
        ) : null} />
        <Bar dataKey="egresos" name="Egresos" radius={[5, 5, 0, 0]} fill={c.danger} maxBarSize={26} isAnimationActive={!reduce} animationDuration={800} />
        <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke={c.primary} strokeWidth={2.5} fill="url(#gIngreso)" isAnimationActive={!reduce} animationDuration={900} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Composición de ingresos por método de pago (dona). */
export function ComposicionChart({ data, onSelect }: { data: MetodoBreak[]; onSelect?: (m: MetodoBreak) => void }) {
  const c = useChartColors();
  const reduce = useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie data={data} dataKey="monto" nameKey="metodo" cx="50%" cy="50%" innerRadius={52} outerRadius={84}
          paddingAngle={3} isAnimationActive={!reduce} animationDuration={900}
          onClick={(d: any) => onSelect?.(d.payload ?? d)} cursor="pointer">
          {data.map((_, i) => <Cell key={i} fill={c.palette[i % c.palette.length]} stroke={c.card} strokeWidth={3} />)}
        </Pie>
        <Tooltip content={({ active, payload }) => active && payload?.length ? (
          <TipBox><p className="font-medium">{payload[0].name}</p><p className="tabular text-primary">{formatRD(payload[0].value as number)}</p></TipBox>
        ) : null} />
      </PieChart>
    </ResponsiveContainer>
  );
}
