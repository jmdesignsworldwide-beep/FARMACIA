import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { requireCapability } from "@/lib/auth/guard";
import { getCliente } from "@/lib/data/clientes";
import { actualizarCliente } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarClientePage({ params }: { params: { id: string } }) {
  await requireCapability("gestionar_clientes");
  const cliente = await getCliente(params.id);
  if (!cliente) notFound();
  const action = actualizarCliente.bind(null, params.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <Link href={`/clientes/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al cliente
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Editar {cliente.nombre}</h1>
      </Reveal>
      <Reveal delay={0.05}><ClienteForm action={action} cliente={cliente} /></Reveal>
    </div>
  );
}
