import { ClipboardList, Sparkles, Info, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { PulseDot } from "@/components/motion/pulse-dot";
import { Card } from "@/components/ui/card";
import { ProveedoresNav } from "@/components/proveedores/proveedores-nav";
import { requireCapability } from "@/lib/auth/guard";
import { getOrdenesSugeridas, ORDENES_DEMO } from "@/lib/data/compras-navegable";
import { formatRD } from "@/lib/utils";

export const dynamic = "force-dynamic";

const estadoCls: Record<string, string> = {
  borrador: "border-border bg-muted text-muted-foreground",
  enviada: "border-accent/30 bg-accent/10 text-accent",
  recibida: "border-success/30 bg-success/10 text-success",
};

export default async function OrdenesPage() {
  await requireCapability("ver_proveedores");
  const sugeridas = await getOrdenesSugeridas();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Órdenes de compra</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sugerencias por bajo stock y órdenes recientes.</p>
      </Reveal>

      <ProveedoresNav />

      {/* Sugeridas por bajo stock (real) */}
      <Reveal>
        <Card>
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-warning" /><h2 className="text-base font-semibold tracking-tight">Sugeridas por bajo stock</h2></div>
          {sugeridas.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Sin sugerencias: el stock está saludable.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sugeridas.map((o) => (
                <li key={o.producto} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
                  <PulseDot tone="warning" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.producto}</p>
                    <p className="text-xs text-muted-foreground">Stock {o.stock} · mínimo {o.minimo}</p>
                  </div>
                  <span className="tabular text-sm font-semibold text-primary">Pedir {o.sugerido}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Reveal>

      {/* Órdenes recientes (demostración) */}
      <Reveal>
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight"><ClipboardList className="h-4 w-4" /> Órdenes recientes</h2>
      </Reveal>
      <Stagger className="space-y-2.5">
        {ORDENES_DEMO.map((o) => (
          <StaggerItem key={o.id}>
            <div className="glass flex items-center gap-3 rounded-2xl p-4 shadow-elev-1">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold tracking-tight">{o.id}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${estadoCls[o.estado]}`}>{o.estado}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{o.proveedor} · {o.items.length} productos · {o.fecha}</p>
              </div>
              <span className="tabular shrink-0 text-sm font-semibold">{formatRD(o.total)}</span>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Las sugerencias se calculan del stock real. La emisión y recepción de órdenes se construye en la versión de producción.</p>
        </div>
      </Reveal>
    </div>
  );
}
