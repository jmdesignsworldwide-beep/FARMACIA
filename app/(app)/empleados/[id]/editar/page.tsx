import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { EmpleadoForm } from "@/components/empleados/empleado-form";
import { requireCapability } from "@/lib/auth/guard";
import { getEmpleado } from "@/lib/data/empleados";
import { actualizarEmpleado } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarEmpleadoPage({ params }: { params: { id: string } }) {
  await requireCapability("gestionar_empleados");
  const empleado = await getEmpleado(params.id);
  if (!empleado) notFound();
  const action = actualizarEmpleado.bind(null, params.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <Link href={`/empleados/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al empleado
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Editar {empleado.full_name ?? empleado.username}</h1>
      </Reveal>
      <Reveal delay={0.05}>
        <EmpleadoForm action={action} empleado={empleado} />
      </Reveal>
    </div>
  );
}
