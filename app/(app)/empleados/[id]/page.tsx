import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Phone, IdCard, Clock, Briefcase, History } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { RolBadge } from "@/components/empleados/rol-badge";
import { SelloInviolable } from "@/components/empleados/sello-inviolable";
import { ActividadLista } from "@/components/empleados/actividad-lista";
import { Button } from "@/components/ui/button";
import { requireCapability } from "@/lib/auth/guard";
import { getEmpleado, getActividad } from "@/lib/data/empleados";

export const dynamic = "force-dynamic";

export default async function EmpleadoDetallePage({ params }: { params: { id: string } }) {
  await requireCapability("ver_empleados");
  const empleado = await getEmpleado(params.id);
  if (!empleado) notFound();
  const actividad = await getActividad({ empleadoId: params.id }, 50);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Reveal>
        <Link href="/empleados" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a empleados
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{empleado.full_name ?? empleado.username}</h1>
              <RolBadge rol={empleado.rol} />
              {!empleado.activo && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Inactivo</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">@{empleado.username}</p>
          </div>
          <Link href={`/empleados/${empleado.id}/editar`}><Button size="sm"><Pencil className="h-4 w-4" /> Editar</Button></Link>
        </div>
      </Reveal>

      <Reveal>
        <div className="glass grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl p-5 shadow-elev-1 sm:grid-cols-4">
          <Dato icon={<IdCard className="h-4 w-4" />} label="Cédula" value={empleado.cedula ?? "—"} />
          <Dato icon={<Phone className="h-4 w-4" />} label="Teléfono" value={empleado.telefono ?? "—"} />
          <Dato icon={<Briefcase className="h-4 w-4" />} label="Cargo" value={empleado.cargo ?? "—"} />
          <Dato icon={<Clock className="h-4 w-4" />} label="Turno" value={empleado.turno ?? "—"} />
        </div>
      </Reveal>

      <Reveal>
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <History className="h-4 w-4" /> Historial de actividad
          </h2>
          <SelloInviolable className="hidden sm:inline-flex" />
        </div>
      </Reveal>

      <ActividadLista items={actividad} showEmpleado={false} />
    </div>
  );
}

function Dato({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
