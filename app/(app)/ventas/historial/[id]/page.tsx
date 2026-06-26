import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, User, FileText, Info } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { AnularVenta } from "@/components/ventas/anular-venta";
import { getVentaDetalle, metodoLabel } from "@/lib/data/ventas";
import { formatRD } from "@/lib/utils";

export const dynamic = "force-dynamic";

const fmtVenc = (d: string) =>
  new Date(d).toLocaleDateString("es-DO", { month: "short", year: "numeric" });

export default async function VentaDetallePage({ params }: { params: { id: string } }) {
  const detalle = await getVentaDetalle(params.id);
  if (!detalle) notFound();
  const { venta: v, items } = detalle;
  const anulada = v.estado === "anulada";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Reveal>
        <Link href="/ventas/historial" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al historial
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Venta #{v.folio}
              {anulada && (
                <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger"><Ban className="h-3.5 w-3.5" /> Anulada</span>
              )}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(v.created_at).toLocaleString("es-DO", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>
          {!anulada && <AnularVenta ventaId={v.id} folio={v.folio} />}
        </div>
      </Reveal>

      {anulada && (
        <Reveal>
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <p><strong>Venta anulada</strong>{v.anulada_nombre ? ` por ${v.anulada_nombre}` : ""}{v.anulada_at ? ` · ${new Date(v.anulada_at).toLocaleString("es-DO")}` : ""}.</p>
            {v.motivo_anulacion && <p className="mt-0.5 text-danger/90">Motivo: {v.motivo_anulacion}</p>}
          </div>
        </Reveal>
      )}

      {/* Receta */}
      {(v.receta_medico || v.receta_numero) && (
        <Reveal>
          <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>Receta registrada.</strong> {v.receta_paciente ? `Paciente: ${v.receta_paciente}. ` : ""}
              {v.receta_medico ? `Médico: ${v.receta_medico}. ` : ""}{v.receta_numero ? `N°: ${v.receta_numero}.` : ""}
            </p>
          </div>
        </Reveal>
      )}

      {/* Items con lote */}
      <Reveal>
        <div className="glass rounded-2xl p-5 shadow-elev-1">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Productos</h2>
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{it.cantidad}× {it.nombre_producto}</span>
                  <span className="tabular text-sm font-semibold">{formatRD(it.subtotal)}</span>
                </div>
                <p className="tabular text-xs text-muted-foreground">{formatRD(it.precio_unitario)} c/u</p>
                {it.lotes_usados.map((l) => (
                  <p key={l.lote_id} className="text-[11px] text-muted-foreground">
                    ↳ Lote {l.numero_lote} · vence {fmtVenc(l.fecha_vencimiento)} · {l.cantidad} uds
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Totales + meta */}
      <Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="glass rounded-2xl p-5 shadow-elev-1">
            <h2 className="mb-3 text-sm font-semibold tracking-tight">Pago</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatRD(v.subtotal)} />
              {v.descuento > 0 && <Row label="Descuento" value={`− ${formatRD(v.descuento)}`} />}
              <Row label="Total" value={formatRD(v.total)} strong />
              <Row label="Método" value={metodoLabel(v.metodo_pago)} />
              {v.metodo_pago === "efectivo" && v.monto_recibido != null && (
                <>
                  <Row label="Recibido" value={formatRD(v.monto_recibido)} />
                  <Row label="Cambio" value={formatRD(v.cambio)} />
                </>
              )}
              {v.voucher && <Row label="Voucher" value={v.voucher} />}
            </dl>
          </div>
          <div className="glass flex flex-col justify-center rounded-2xl p-5 shadow-elev-1">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><User className="h-4 w-4" /> Atendido por</p>
            <p className="mt-1 text-lg font-semibold">{v.empleado_nombre ?? "—"}</p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Documento de ejemplo generado para demostración.</p>
        </div>
      </Reveal>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`tabular ${strong ? "text-base font-semibold" : "font-medium"}`}>{value}</dd>
    </div>
  );
}
