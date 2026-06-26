import Link from "next/link";
import { Search, Receipt, ChevronRight, Ban } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { VentasNav } from "@/components/ventas/ventas-nav";
import { getVentas, metodoLabel } from "@/lib/data/ventas";
import { formatRD } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();
  const ventas = await getVentas(q);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Historial de ventas</h1>
            <p className="mt-1 text-sm text-muted-foreground">Ventas recientes. Clic en una para ver el detalle.</p>
          </div>
          <VentasNav />
        </div>
      </Reveal>

      <form className="flex items-center gap-2.5 rounded-xl border border-input bg-card/50 px-3.5 py-2.5 shadow-elev-1 focus-within:border-ring">
        <Search className="h-[18px] w-[18px] text-muted-foreground" />
        <input name="q" defaultValue={q} inputMode="numeric" placeholder="Buscar por número de folio…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
      </form>

      {ventas.length === 0 ? (
        <div className="glass flex flex-col items-center gap-2 rounded-2xl p-12 text-center shadow-elev-1">
          <Receipt className="h-9 w-9 text-muted-foreground" />
          <p className="text-sm font-medium">Sin ventas</p>
          <p className="text-xs text-muted-foreground">{q ? "No hay una venta con ese folio." : "Las ventas del POS aparecerán aquí."}</p>
        </div>
      ) : (
        <Stagger className="space-y-2.5">
          {ventas.map((v) => (
            <StaggerItem key={v.id}>
              <Link href={`/ventas/historial/${v.id}`} className="group flex items-center gap-3 rounded-2xl glass p-4 shadow-elev-1 transition-shadow hover:shadow-elev-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Receipt className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    Venta #{v.folio}
                    {v.estado === "anulada" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger"><Ban className="h-3 w-3" /> Anulada</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {v.items_count} {v.items_count === 1 ? "producto" : "productos"} · {metodoLabel(v.metodo_pago)} · {new Date(v.created_at).toLocaleString("es-DO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`tabular shrink-0 text-sm font-semibold ${v.estado === "anulada" ? "text-muted-foreground line-through" : ""}`}>{formatRD(v.total)}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
