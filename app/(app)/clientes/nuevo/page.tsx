import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { requireCapability } from "@/lib/auth/guard";
import { crearCliente } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo cliente — JM Farmacia" };

export default async function NuevoClientePage() {
  await requireCapability("gestionar_clientes");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a clientes
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo cliente</h1>
      </Reveal>
      <Reveal delay={0.05}><ClienteForm action={crearCliente} /></Reveal>
    </div>
  );
}
