import Link from "next/link";
import { CalendarClock, PackageX, ShieldCheck, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { InventarioNav } from "@/components/inventario/inventario-nav";
import { VencimientoBadge } from "@/components/inventario/badges";
import { getLotesPorVencer, getProductos, type LoteConProducto } from "@/lib/data/inventory";

export const dynamic = "force-dynamic";

export default async function AlertasPage() {
  const [lotes, productos] = await Promise.all([
    getLotesPorVencer(90),
    getProductos({ bajoStock: true }),
  ]);

  const grupos: { titulo: string; items: LoteConProducto[] }[] = [
    { titulo: "Vencen en ≤30 días", items: lotes.filter((l) => l.dias_para_vencer <= 30) },
    { titulo: "Vencen en 31–60 días", items: lotes.filter((l) => l.dias_para_vencer > 30 && l.dias_para_vencer <= 60) },
    { titulo: "Vencen en 61–90 días", items: lotes.filter((l) => l.dias_para_vencer > 60) },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Alertas de inventario</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vencimientos próximos y productos bajo el mínimo.</p>
      </Reveal>

      <InventarioNav />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Por vencer */}
        <Reveal className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold tracking-tight">Por vencer</h2>
          </div>
          {lotes.length === 0 ? (
            <EmptyOk text="Ningún lote vence en los próximos 90 días." />
          ) : (
            grupos.map((g) =>
              g.items.length === 0 ? null : (
                <div key={g.titulo} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{g.titulo}</p>
                  {g.items.map((l) => (
                    <Link key={l.id} href={`/inventario/${l.producto_id}`}
                      className="group flex items-center gap-3 rounded-xl glass p-3.5 shadow-elev-1 transition-shadow hover:shadow-elev-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {l.productos?.nombre_generico}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({l.productos?.nombre_comercial})
                          </span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Lote {l.numero_lote} · {l.cantidad} uds
                        </p>
                      </div>
                      <VencimientoBadge dias={l.dias_para_vencer} />
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              ),
            )
          )}
        </Reveal>

        {/* Bajo stock */}
        <Reveal delay={0.1} className="space-y-4">
          <div className="flex items-center gap-2">
            <PackageX className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold tracking-tight">Bajo stock</h2>
          </div>
          {productos.length === 0 ? (
            <EmptyOk text="Todos los productos están por encima de su mínimo." />
          ) : (
            <div className="space-y-2">
              {productos.map((p) => (
                <Link key={p.id} href={`/inventario/${p.id}`}
                  className="group flex items-center gap-3 rounded-xl glass p-3.5 shadow-elev-1 transition-shadow hover:shadow-elev-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.nombre_comercial}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.nombre_generico} · {p.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-semibold text-warning">{p.stock_total} uds</p>
                    <p className="text-[11px] text-muted-foreground">mínimo {p.stock_minimo}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}

function EmptyOk({ text }: { text: string }) {
  return (
    <div className="glass flex flex-col items-center gap-2 rounded-2xl p-8 text-center shadow-elev-1">
      <ShieldCheck className="h-8 w-8 text-success" />
      <p className="text-sm font-medium text-success">Todo al día</p>
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
