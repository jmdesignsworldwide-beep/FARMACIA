import { History } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SelloInviolable } from "@/components/empleados/sello-inviolable";
import { ActividadLista } from "@/components/empleados/actividad-lista";
import { requireCapability } from "@/lib/auth/guard";
import { getActividad, getEmpleados } from "@/lib/data/empleados";
import { TIPO_LABEL } from "@/lib/data/actividad-shared";

export const dynamic = "force-dynamic";

export default async function ActividadPage({
  searchParams,
}: {
  searchParams: { tipo?: string; empleado?: string };
}) {
  await requireCapability("ver_historial");
  const [items, empleados] = await Promise.all([
    getActividad({ tipo: searchParams.tipo, empleadoId: searchParams.empleado }, 150),
    getEmpleados(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          <History className="h-6 w-6" /> Historial de actividad
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Todo lo que pasa en la farmacia, atribuido a quien lo hizo.</p>
      </Reveal>

      <Reveal><SelloInviolable className="w-full sm:w-auto" /></Reveal>

      <form className="flex flex-col gap-2 sm:flex-row">
        <select name="tipo" defaultValue={searchParams.tipo ?? ""} className="rounded-xl border border-input bg-card/50 px-3.5 py-2.5 text-sm outline-none focus:border-ring sm:w-56">
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select name="empleado" defaultValue={searchParams.empleado ?? ""} className="rounded-xl border border-input bg-card/50 px-3.5 py-2.5 text-sm outline-none focus:border-ring sm:w-56">
          <option value="">Todos los empleados</option>
          {empleados.map((e) => (
            <option key={e.id} value={e.id}>{e.full_name ?? e.username}</option>
          ))}
        </select>
        <button type="submit" className="rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted">Filtrar</button>
      </form>

      <ActividadLista items={items} />
    </div>
  );
}
