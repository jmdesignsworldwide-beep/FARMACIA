import Link from "next/link";
import { Boxes, AlertTriangle, CalendarClock } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { PulseDot } from "@/components/motion/pulse-dot";
import { InventarioNav } from "@/components/inventario/inventario-nav";
import { Filtros } from "@/components/inventario/filtros";
import { ProductoLista } from "@/components/inventario/producto-lista";
import { getProductos, getInventoryStats } from "@/lib/data/inventory";
import { requireCapability } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireCapability("ver_inventario");
  const filtros = {
    q: one(searchParams.q),
    categoria: one(searchParams.categoria),
    controlado: Boolean(one(searchParams.controlado)),
    receta: Boolean(one(searchParams.receta)),
    bajoStock: Boolean(one(searchParams.bajo)),
  };

  const [productos, stats] = await Promise.all([
    getProductos(filtros),
    getInventoryStats(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Inventario</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catálogo de medicamentos y stock real por lote.
          </p>
        </div>
      </Reveal>

      <InventarioNav />

      {/* Resumen */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={Boxes} label="Productos activos" value={stats.totalProductos} href="/inventario" tone="primary" />
        <StatCard icon={AlertTriangle} label="Bajo stock" value={stats.bajoStock.length} href="/inventario?bajo=1" tone="warning" alert={stats.bajoStock.length > 0} />
        <StatCard icon={CalendarClock} label="Por vencer (30d)" value={stats.porVencer30} href="/inventario/alertas" tone="warning" alert={stats.porVencer30 > 0} />
      </div>

      <Reveal>
        <Filtros />
      </Reveal>

      <ProductoLista productos={productos} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  tone,
  alert = false,
}: {
  icon: typeof Boxes;
  label: string;
  value: number;
  href: string;
  tone: "primary" | "warning";
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="glass flex items-center gap-3 rounded-2xl p-4 shadow-elev-1 transition-shadow hover:shadow-elev-2"
    >
      <span
        className={`grid h-10 w-10 place-items-center rounded-xl ${
          alert ? "bg-warning/15 text-warning" : "bg-primary/12 text-primary"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div>
        <p className="tabular text-2xl font-semibold leading-none">
          <CountUp value={value} />
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          {alert && <PulseDot tone="warning" />}
          {label}
        </p>
      </div>
    </Link>
  );
}
