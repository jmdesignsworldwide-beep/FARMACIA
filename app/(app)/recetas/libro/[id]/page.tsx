import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookLock, Pill, User, Stethoscope, FileText, UserCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { DisclaimerControlados } from "@/components/recetas/disclaimer";
import { SelloInviolable } from "@/components/empleados/sello-inviolable";
import { requireCapability } from "@/lib/auth/guard";
import { getLibroEntry } from "@/lib/data/recetas";

export const dynamic = "force-dynamic";

export default async function LibroEntradaPage({ params }: { params: { id: string } }) {
  await requireCapability("ver_controlados");
  const e = await getLibroEntry(params.id);
  if (!e) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Reveal>
        <Link href="/recetas/libro" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al libro
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
          <BookLock className="h-5 w-5 text-danger" /> Asiento de controlado
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{new Date(e.created_at).toLocaleString("es-DO", { dateStyle: "long", timeStyle: "short" })}</p>
      </Reveal>

      <Reveal>
        <div className="glass grid grid-cols-1 gap-4 rounded-2xl p-5 shadow-elev-1 sm:grid-cols-2">
          <Dato icon={<Pill className="h-4 w-4" />} label="Producto" value={`${e.producto_nombre} × ${e.cantidad}`} />
          <Dato icon={<FileText className="h-4 w-4" />} label="Número de receta" value={e.numero_receta ?? "S/N"} />
          <Dato icon={<Stethoscope className="h-4 w-4" />} label="Médico" value={e.medico_nombre ?? "—"} sub={e.medico_colegiatura ?? undefined} />
          <Dato icon={<User className="h-4 w-4" />} label="Paciente" value={e.paciente_nombre ?? "—"} sub={e.paciente_cedula ?? undefined} />
          <Dato icon={<UserCheck className="h-4 w-4" />} label="Despachado por" value={e.empleado_nombre ?? "—"} />
        </div>
      </Reveal>

      <Reveal><SelloInviolable /></Reveal>
      <Reveal><DisclaimerControlados /></Reveal>
    </div>
  );
}

function Dato({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
