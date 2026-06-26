import { Reveal } from "@/components/motion/reveal";
import { VentasNav } from "@/components/ventas/ventas-nav";
import { CajaPanel } from "@/components/ventas/caja-panel";
import { getCajaActual, getCajaResumen, getEgresos } from "@/lib/data/ventas";
import { requireCapability } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
  await requireCapability("usar_caja");
  const caja = await getCajaActual();
  const [resumen, egresos] = caja
    ? await Promise.all([getCajaResumen(caja), getEgresos(caja.id)])
    : [null, []];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Caja</h1>
            <p className="mt-1 text-sm text-muted-foreground">Apertura, ingresos del turno, egresos y cierre con arqueo.</p>
          </div>
          <VentasNav />
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <CajaPanel caja={caja} resumen={resumen} egresos={egresos} />
      </Reveal>
    </div>
  );
}
