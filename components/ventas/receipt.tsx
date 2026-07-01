"use client";

import { CheckCircle2, Info, Plus, Printer, MessageCircle, Cross } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatRD } from "@/lib/utils";
import { metodoLabel, type VentaItem } from "@/lib/data/ventas-shared";

export type ReciboData = {
  folio: number;
  fecha: string; // ISO
  farmacia: string;
  empleado: string | null;
  metodo: string;
  subtotal: number;
  descuento: number;
  itbis: number;
  total: number;
  cambio: number;
  clienteNombre: string | null;
  items: VentaItem[];
};

const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleString("es-DO", { dateStyle: "long", timeStyle: "short" });

/** Texto plano del recibo para compartir por WhatsApp. */
function reciboTexto(d: ReciboData): string {
  const L = [
    `*${d.farmacia}*`,
    `Recibo #${d.folio}`,
    fechaLarga(d.fecha),
    d.clienteNombre ? `Cliente: ${d.clienteNombre}` : "",
    "────────────────────",
    ...d.items.map(
      (it) => `${it.cantidad}× ${it.nombre_producto}${it.presentacion ? ` (${it.presentacion})` : ""}  —  ${formatRD(it.subtotal)}`,
    ),
    "────────────────────",
    `Subtotal: ${formatRD(d.subtotal)}`,
    d.descuento > 0 ? `Descuento: -${formatRD(d.descuento)}` : "",
    `ITBIS (18%): ${d.itbis > 0 ? formatRD(d.itbis) : "Exento"}`,
    `*TOTAL: ${formatRD(d.total)}*`,
    `Pago: ${metodoLabel(d.metodo)}`,
    d.metodo === "efectivo" ? `Cambio: ${formatRD(d.cambio)}` : "",
    d.empleado ? `Atendió: ${d.empleado}` : "",
    "",
    "Documento de ejemplo (demostración). ITBIS y NCF simulados, no certificado ante la DGII.",
  ];
  return L.filter(Boolean).join("\n");
}

/** Abre una ventana con el recibo maquetado y lanza imprimir (permite guardar como PDF). */
function imprimirRecibo(d: ReciboData) {
  const filas = d.items
    .map(
      (it) => `<tr><td>${it.cantidad}× ${it.nombre_producto}${it.presentacion ? ` <span class="muted">(${it.presentacion})</span>` : ""}</td><td class="r">${formatRD(it.subtotal)}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Recibo #${d.folio}</title>
  <style>
    *{box-sizing:border-box} body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;color:#0f1f1b;margin:0;padding:24px;background:#fff}
    .recibo{max-width:360px;margin:0 auto}
    .brand{text-align:center;margin-bottom:4px;font-size:20px;font-weight:700;letter-spacing:-.01em}
    .sub{text-align:center;color:#5b6b66;font-size:12px;margin-bottom:14px}
    .meta{font-size:12px;color:#5b6b66;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    td{padding:4px 0;vertical-align:top} .r{text-align:right;white-space:nowrap;padding-left:10px}
    .muted{color:#8a9893;font-size:11px}
    .sep{border-top:1px dashed #c7d2cd;margin:10px 0}
    .row{display:flex;justify-content:space-between;font-size:13px;padding:2px 0}
    .total{font-size:18px;font-weight:700}
    .foot{margin-top:14px;font-size:10px;color:#8a9893;text-align:center;line-height:1.5}
  </style></head><body><div class="recibo">
    <div class="brand">✚ ${d.farmacia}</div>
    <div class="sub">Recibo de venta</div>
    <div class="meta">Recibo #${d.folio} · ${fechaLarga(d.fecha)}${d.clienteNombre ? `<br>Cliente: ${d.clienteNombre}` : ""}${d.empleado ? `<br>Atendió: ${d.empleado}` : ""}</div>
    <div class="sep"></div>
    <table>${filas}</table>
    <div class="sep"></div>
    <div class="row"><span>Subtotal</span><span>${formatRD(d.subtotal)}</span></div>
    ${d.descuento > 0 ? `<div class="row"><span>Descuento</span><span>-${formatRD(d.descuento)}</span></div>` : ""}
    <div class="row"><span>ITBIS (18%)</span><span>${d.itbis > 0 ? formatRD(d.itbis) : "Exento"}</span></div>
    <div class="row total"><span>Total</span><span>${formatRD(d.total)}</span></div>
    <div class="row"><span>Pago</span><span>${metodoLabel(d.metodo)}</span></div>
    ${d.metodo === "efectivo" ? `<div class="row"><span>Cambio</span><span>${formatRD(d.cambio)}</span></div>` : ""}
    <div class="foot">Documento de ejemplo generado para demostración.<br>ITBIS y NCF simulados, no certificado ante la DGII.</div>
  </div><script>window.onload=function(){window.print()}</script></body></html>`;
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

/** Recibo digital premium tras cobrar. */
export function Receipt({ data, onClose }: { data: ReciboData | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(data)} onClose={onClose} className="max-w-md">
      {data && (
        <>
          <div className="mb-3 flex items-center justify-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-semibold">Venta completada</span>
          </div>

          {/* "Papel" del recibo */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-elev-1">
            <div className="flex flex-col items-center text-center">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elev-1">
                <Cross className="h-6 w-6" strokeWidth={2.5} />
              </span>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">{data.farmacia}</h2>
              <p className="text-xs text-muted-foreground">Recibo de venta</p>
            </div>

            <div className="mt-3 flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              <span>Recibo <span className="tabular font-medium text-foreground">#{data.folio}</span></span>
              <span className="tabular">{fechaLarga(data.fecha)}</span>
              {data.clienteNombre && <span className="w-full">Cliente: {data.clienteNombre}</span>}
            </div>

            <div className="my-3 border-t border-dashed border-border/70" />

            <div className="space-y-1.5">
              {data.items.map((it) => (
                <div key={it.id} className="flex items-start justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="tabular font-medium">{it.cantidad}×</span> {it.nombre_producto}
                    {it.presentacion && <span className="ml-1 text-[11px] text-muted-foreground">· {it.presentacion}</span>}
                  </span>
                  <span className="tabular shrink-0 font-medium">{formatRD(it.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="my-3 border-t border-dashed border-border/70" />

            <div className="space-y-1">
              <Row label="Subtotal" value={formatRD(data.subtotal)} />
              {data.descuento > 0 && <Row label="Descuento" value={`-${formatRD(data.descuento)}`} />}
              <Row label="ITBIS (18%)" value={data.itbis > 0 ? formatRD(data.itbis) : "Exento"} />
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-sm font-semibold">Total</span>
                <span className="tabular text-xl font-bold tracking-tight">{formatRD(data.total)}</span>
              </div>
              <Row label="Pago" value={metodoLabel(data.metodo)} />
              {data.metodo === "efectivo" && <Row label="Cambio" value={formatRD(data.cambio)} accent />}
            </div>

            {data.empleado && (
              <p className="mt-3 text-center text-[11px] text-muted-foreground">Atendió: {data.empleado}</p>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-[11px] text-warning">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>ITBIS simulado para demostración. El tratamiento fiscal real (exenciones, tasas) se configura y verifica en producción. NCF simulado, no certificado ante la DGII.</p>
          </div>

          {/* Acciones */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(reciboTexto(data))}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-2.5 text-sm font-medium text-success transition-colors hover:bg-success/15">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <Button type="button" variant="outline" onClick={() => imprimirRecibo(data)}>
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </Button>
          </div>
          <Button onClick={onClose} size="lg" className="mt-2 w-full">
            <Plus className="h-4 w-4" /> Nueva venta
          </Button>
        </>
      )}
    </Modal>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`tabular text-sm font-medium ${accent ? "text-success" : ""}`}>{value}</span>
    </div>
  );
}
