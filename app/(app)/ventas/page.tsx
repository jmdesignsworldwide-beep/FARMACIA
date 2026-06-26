import { Reveal } from "@/components/motion/reveal";
import { VentasNav } from "@/components/ventas/ventas-nav";
import { POS } from "@/components/ventas/pos";
import { getProductosVendibles, getCajaActual } from "@/lib/data/ventas";
import { requireCapability } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  await requireCapability("usar_pos");
  const [productos, caja] = await Promise.all([
    getProductosVendibles(),
    getCajaActual(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Punto de venta</h1>
            <p className="mt-1 text-sm text-muted-foreground">Busca, agrega al carrito y cobra. El stock baja por FEFO automáticamente.</p>
          </div>
          <VentasNav />
        </div>
      </Reveal>

      <POS productos={productos} cajaAbierta={Boolean(caja)} />
    </div>
  );
}
