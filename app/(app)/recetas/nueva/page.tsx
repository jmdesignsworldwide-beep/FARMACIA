import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { RecetaForm } from "@/components/recetas/receta-form";
import { requireCapability } from "@/lib/auth/guard";
import { getProductosParaReceta } from "@/lib/data/recetas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nueva receta — JM Farmacia" };

export default async function NuevaRecetaPage() {
  await requireCapability("gestionar_recetas");
  const productos = await getProductosParaReceta();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <Link href="/recetas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a recetas
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Nueva receta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Registra médico, paciente y medicamentos. Los controlados piden verificación.</p>
      </Reveal>
      <Reveal delay={0.05}><RecetaForm productos={productos} /></Reveal>
    </div>
  );
}
