import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { EmpleadoForm } from "@/components/empleados/empleado-form";
import { requireCapability } from "@/lib/auth/guard";
import { crearEmpleado } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo empleado — JM Farmacia" };

export default async function NuevoEmpleadoPage() {
  await requireCapability("gestionar_empleados");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <Link href="/empleados" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a empleados
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo empleado</h1>
        <p className="mt-1 text-sm text-muted-foreground">Crea su acceso propio (usuario + contraseña) y asígnale un rol.</p>
      </Reveal>
      <Reveal delay={0.05}>
        <EmpleadoForm action={crearEmpleado} />
      </Reveal>
    </div>
  );
}
