import Link from "next/link";
import { Sparkles, Truck, TrendingUp, BadgeCheck, CalendarClock, Package, ChevronRight } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { FillBar } from "@/components/motion/fill-bar";
import { AvisarProveedor } from "./avisar-proveedor";
import { formatRD } from "@/lib/utils";
import type { InteligenciaProducto } from "@/lib/data/inteligencia";

const fmtFecha = (d: string | null) => (d ? new Date(d).toLocaleDateString("es-DO", { month: "short", year: "numeric" }) : "—");

export function InteligenciaProveedores({ data, farmacia }: { data: InteligenciaProducto; farmacia: string }) {
  const p = data.producto;

  return (
    <div className="space-y-4">
      {/* Insight headline */}
      <div className="glass relative overflow-hidden rounded-2xl border border-primary/20 p-5 shadow-elev-2">
        <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elev-1"><Sparkles className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Inteligencia de proveedores</p>
            {data.headline ? (
              <p className="mt-1 text-lg font-semibold leading-snug tracking-tight">
                El <span className="text-gradient-brand">{data.headline.pct}%</span> de lo {data.esReal ? "vendido" : "que manejas"} de {p.nombre_comercial} {data.esReal ? "salió de" : "vino de"} lotes de <span className="text-gradient-brand">{data.headline.proveedor}</span>.
              </p>
            ) : (
              <p className="mt-1 text-lg font-semibold leading-snug tracking-tight">Registra entradas y ventas para ver de qué proveedor sale tu mercancía.</p>
            )}
            {!data.esReal && data.headline && (
              <p className="mt-1 text-xs text-muted-foreground">Estimado según lo que te ha surtido (aún sin ventas registradas de este producto).</p>
            )}
          </div>
        </div>

        {/* Origen por proveedor */}
        {data.origen.length > 0 && (
          <div className="relative mt-4 space-y-3">
            {data.origen.map((o) => (
              <FillBar key={o.proveedorId ?? o.nombre} label={`${o.nombre}${data.esReal ? ` · ${o.unidades} uds vendidas` : ""}`} value={o.pct} max={100} />
            ))}
          </div>
        )}

        {data.proveedoresNotificar.length > 0 && (
          <div className="relative mt-5 flex flex-wrap items-center gap-3">
            <AvisarProveedor proveedores={data.proveedoresNotificar} farmacia={farmacia} producto={p.nombre_comercial} presentacion={p.presentacion} sugerencia={p.sugerencia} />
            <span className="text-xs text-muted-foreground">Sugerencia de reabastecimiento: <strong>{p.sugerencia} uds</strong> (stock {p.stock_total} · mínimo {p.stock_minimo}).</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tus proveedores de este producto */}
        <div className="glass rounded-2xl p-5 shadow-elev-1">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight"><Truck className="h-4 w-4 text-primary" /> Tus proveedores de este producto</h3>
          {data.surtido.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay lotes con proveedor registrado.</p>
          ) : (
            <ul className="space-y-2">
              {data.surtido.map((s) => (
                <li key={s.proveedorId ?? s.nombre} className="rounded-xl border border-border/60 bg-card/40 p-3">
                  <p className="text-sm font-semibold">{s.nombre}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" /> <span className="tabular"><CountUp value={s.unidadesSurtidas} /></span> uds en {s.lotes} {s.lotes === 1 ? "lote" : "lotes"}</span>
                    <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> última: {fmtFecha(s.ultimaEntrada)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Comparador */}
        <div className="glass rounded-2xl p-5 shadow-elev-1">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight"><TrendingUp className="h-4 w-4 text-accent" /> Comparador de proveedores</h3>
          {data.comparador.length === 0 ? (
            <p className="text-sm text-muted-foreground">Registra proveedores para comparar.</p>
          ) : (
            <ul className="space-y-2">
              {data.comparador.map((c) => {
                const inner = (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium">{c.nombre}{c.recomendado && <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success"><BadgeCheck className="h-3 w-3" /> Más conveniente</span>}</p>
                      <p className="text-xs text-muted-foreground">{c.veces} {c.veces === 1 ? "vez" : "veces"} surtido</p>
                    </div>
                    <span className="tabular text-sm font-semibold">{formatRD(c.precio)}</span>
                    {c.proveedorId && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />}
                  </>
                );
                const cls = `flex items-center gap-3 rounded-xl border px-3 py-2.5 ${c.recomendado ? "border-success/40 bg-success/10" : "border-border/60 bg-card/40"}`;
                return (
                  <li key={c.proveedorId ?? c.nombre}>
                    {c.proveedorId ? (
                      <Link href={`/proveedores/${c.proveedorId}`} className={`group ${cls} transition-colors hover:bg-muted`}>{inner}</Link>
                    ) : (
                      <div className={cls}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">Frecuencia real; precio de referencia por proveedor.</p>
        </div>
      </div>
    </div>
  );
}
