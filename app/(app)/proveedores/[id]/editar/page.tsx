import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProveedorForm } from "@/components/proveedores/proveedor-form";
import { requireCapability } from "@/lib/auth/guard";
import { getProveedor } from "@/lib/data/proveedores";
import { actualizarProveedor } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarProveedorPage({ params }: { params: { id: string } }) {
  await requireCapability("gestionar_proveedores");
  const proveedor = await getProveedor(params.id);
  if (!proveedor) notFound();
  const action = actualizarProveedor.bind(null, params.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <Link href={`/proveedores/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al proveedor
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Editar {proveedor.nombre}</h1>
      </Reveal>
      <Reveal delay={0.05}><ProveedorForm action={action} proveedor={proveedor} /></Reveal>
    </div>
  );
}
