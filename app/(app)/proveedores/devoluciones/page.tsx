import { Undo2, Info, Paperclip } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { ProveedoresNav } from "@/components/proveedores/proveedores-nav";
import { requireCapability } from "@/lib/auth/guard";
import { DEVOLUCIONES_DEMO } from "@/lib/data/compras-navegable";
import { formatRD } from "@/lib/utils";

export const dynamic = "force-dynamic";

const estadoCls: Record<string, string> = {
  solicitada: "border-warning/30 bg-warning/10 text-warning",
  aceptada: "border-accent/30 bg-accent/10 text-accent",
  completada: "border-success/30 bg-success/10 text-success",
};

export default async function DevolucionesPage() {
  await requireCapability("ver_proveedores");

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Devoluciones a proveedores</h1>
        <p className="mt-1 text-sm text-muted-foreground">Productos devueltos por vencimiento, daño o error.</p>
      </Reveal>

      <ProveedoresNav />

      <Stagger className="space-y-2.5">
        {DEVOLUCIONES_DEMO.map((d) => (
          <StaggerItem key={d.id}>
            <div className="glass flex items-center gap-3 rounded-2xl p-4 shadow-elev-1">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-danger/12 text-danger"><Undo2 className="h-[18px] w-[18px]" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold tracking-tight">{d.id}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${estadoCls[d.estado]}`}>{d.estado}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{d.proveedor} · {d.motivo} · {d.fecha}</p>
              </div>
              <span className="tabular shrink-0 text-sm font-semibold">{formatRD(d.monto)}</span>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <div className="glass flex items-center gap-3 rounded-2xl p-4 shadow-elev-1">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground"><Paperclip className="h-[18px] w-[18px]" /></span>
          <div><p className="text-sm font-medium">Facturas de compra adjuntas</p><p className="text-xs text-muted-foreground">Vista de demostración del adjunto de facturas.</p></div>
        </div>
      </Reveal>

      <Reveal>
        <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Flujo de devoluciones y adjunto de facturas de demostración. La operación completa se configura en producción.</p>
        </div>
      </Reveal>
    </div>
  );
}
