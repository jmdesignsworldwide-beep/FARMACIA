import { Reveal } from "@/components/motion/reveal";
import { ReportesView } from "@/components/reportes/reportes-view";
import { requireCapability } from "@/lib/auth/guard";
import { getReportes, type Periodo } from "@/lib/data/reportes";

export const dynamic = "force-dynamic";

export default async function ReportesPage({ searchParams }: { searchParams: { periodo?: string } }) {
  await requireCapability("ver_reportes");
  const periodo: Periodo = (["dia", "semana", "mes"].includes(searchParams.periodo ?? "")
    ? searchParams.periodo
    : "mes") as Periodo;
  const data = await getReportes(periodo);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reportes y estadísticas</h1>
        <p className="mt-1 text-sm text-muted-foreground">El pulso del negocio: ventas, productos, empleados y alertas.</p>
      </Reveal>
      <ReportesView data={data} />
    </div>
  );
}
