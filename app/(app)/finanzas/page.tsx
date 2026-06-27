import { Reveal } from "@/components/motion/reveal";
import { FinanzasView } from "@/components/finanzas/finanzas-view";
import { requireCapability } from "@/lib/auth/guard";
import { getFinanzas, type FinanzasPeriodo } from "@/lib/data/finanzas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finanzas — JM Farmacia" };

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: { periodo?: string; desde?: string; hasta?: string };
}) {
  await requireCapability("ver_finanzas");
  const periodo: FinanzasPeriodo = (["dia", "semana", "mes", "custom"].includes(searchParams.periodo ?? "")
    ? searchParams.periodo
    : "mes") as FinanzasPeriodo;
  const data = await getFinanzas(periodo, searchParams.desde, searchParams.hasta);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Panel financiero</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El cerebro del negocio: lo que entra, lo que sale, lo que de verdad ganas y cuánto vale tu farmacia.
        </p>
      </Reveal>
      <FinanzasView data={data} />
    </div>
  );
}
