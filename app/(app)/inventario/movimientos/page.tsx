import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, History } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { InventarioNav } from "@/components/inventario/inventario-nav";
import { getMovimientos } from "@/lib/data/inventory";
import { requireCapability } from "@/lib/auth/guard";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const META = {
  entrada: { icon: ArrowDownToLine, label: "Entrada", tone: "text-success", bg: "bg-success/15" },
  salida: { icon: ArrowUpFromLine, label: "Salida", tone: "text-danger", bg: "bg-danger/15" },
  ajuste: { icon: SlidersHorizontal, label: "Ajuste", tone: "text-accent", bg: "bg-accent/15" },
} as const;

export default async function MovimientosPage() {
  await requireCapability("ver_inventario");
  const movimientos = await getMovimientos(60);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Movimientos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Historial de entradas, salidas y ajustes de inventario.</p>
      </Reveal>

      <InventarioNav />

      {movimientos.length === 0 ? (
        <div className="glass flex flex-col items-center gap-2 rounded-2xl p-12 text-center shadow-elev-1">
          <History className="h-9 w-9 text-muted-foreground" />
          <p className="text-sm font-medium">Sin movimientos todavía</p>
          <p className="text-xs text-muted-foreground">Registra una entrada de mercancía para empezar.</p>
        </div>
      ) : (
        <Stagger className="flex flex-col gap-2.5">
          {movimientos.map((m) => {
            const meta = META[m.tipo];
            const Icon = meta.icon;
            const signo = m.cantidad > 0 ? "+" : "";
            return (
              <StaggerItem key={m.id}>
                <div className="flex items-center gap-3 rounded-xl glass p-3.5 shadow-elev-1">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", meta.bg, meta.tone)}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {m.productos?.nombre_comercial ?? "Producto"}{" "}
                      <span className="font-normal text-muted-foreground">{meta.label.toLowerCase()}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.motivo ?? meta.label} ·{" "}
                      {new Date(m.created_at).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={cn("tabular shrink-0 text-sm font-semibold", meta.tone)}>
                    {signo}{m.cantidad} uds
                  </span>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
