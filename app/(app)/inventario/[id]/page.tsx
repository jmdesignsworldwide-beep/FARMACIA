import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  PackagePlus,
  ShieldAlert,
  FileText,
  Layers,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { ControladoBadge, RecetaBadge, BajoStockBadge } from "@/components/inventario/badges";
import { LotesTabla } from "@/components/inventario/lotes-tabla";
import { Button } from "@/components/ui/button";
import { getProductoDetalle } from "@/lib/data/inventory";
import { requireCapability } from "@/lib/auth/guard";
import { formatRD } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductoDetallePage({
  params,
}: {
  params: { id: string };
}) {
  await requireCapability("ver_inventario");
  const detalle = await getProductoDetalle(params.id);
  if (!detalle) notFound();
  const { producto: p, lotes } = detalle;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Reveal>
        <Link href="/inventario" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al inventario
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.nombre_comercial}</h1>
              {p.controlado && <ControladoBadge />}
              {p.requiere_receta && <RecetaBadge />}
              {p.bajo_stock && <BajoStockBadge />}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {p.nombre_generico}
              {p.concentracion ? ` · ${p.concentracion}` : ""}
              {p.presentacion ? ` · ${p.presentacion}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/inventario/entrada?producto=${p.id}`}>
              <Button variant="outline" size="sm"><PackagePlus className="h-4 w-4" /> Entrada</Button>
            </Link>
            <Link href={`/inventario/${p.id}/editar`}>
              <Button size="sm"><Pencil className="h-4 w-4" /> Editar</Button>
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Alertas especiales */}
      {(p.controlado || p.requiere_receta) && (
        <Reveal className="space-y-2">
          {p.controlado && (
            <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <p><strong>Medicamento controlado.</strong> Requiere control especial de venta y registro.</p>
            </div>
          )}
          {p.requiere_receta && (
            <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
              <FileText className="h-5 w-5 shrink-0" />
              <p><strong>Requiere receta médica.</strong> No debe venderse sin receta válida.</p>
            </div>
          )}
        </Reveal>
      )}

      {/* Datos + precios */}
      <Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="glass rounded-2xl p-5 shadow-elev-1 lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold tracking-tight">Información</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <Dato label="Laboratorio" value={p.laboratorio ?? "—"} />
              <Dato label="Categoría" value={p.categoria} />
              <Dato label="Código de barras" value={p.codigo_barras ?? "—"} mono />
              <Dato label="Precio costo" value={formatRD(p.precio_costo)} />
              <Dato label="Precio venta" value={formatRD(p.precio_venta)} />
              <Dato label="Margen" value={`${p.margen_pct}%`} accent />
            </dl>
          </div>
          <div className="glass flex flex-col justify-center rounded-2xl p-5 text-center shadow-elev-1">
            <p className="text-xs font-medium text-muted-foreground">Stock total</p>
            <p className="tabular mt-1 text-4xl font-semibold tracking-tight">
              <CountUp value={p.stock_total} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              en {p.lotes_count} {p.lotes_count === 1 ? "lote" : "lotes"} · mínimo {p.stock_minimo}
            </p>
          </div>
        </div>
      </Reveal>

      {/* Lotes */}
      <Reveal>
        <div className="glass rounded-2xl p-5 shadow-elev-1">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Lotes y vencimientos</h2>
          </div>
          <LotesTabla lotes={lotes} productoId={p.id} />
        </div>
      </Reveal>
    </div>
  );
}

function Dato({
  label,
  value,
  mono = false,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 font-medium ${mono ? "tabular font-mono text-xs" : ""} ${accent ? "text-success" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
