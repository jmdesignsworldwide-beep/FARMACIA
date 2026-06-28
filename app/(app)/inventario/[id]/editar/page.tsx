import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProductoForm } from "@/components/inventario/producto-form";
import { getProductoDetalle, getLaboratorios } from "@/lib/data/inventory";
import { requireCapability } from "@/lib/auth/guard";
import { actualizarProducto } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
}: {
  params: { id: string };
}) {
  await requireCapability("editar_inventario");
  const [detalle, laboratorios] = await Promise.all([getProductoDetalle(params.id), getLaboratorios()]);
  if (!detalle) notFound();
  const { producto } = detalle;
  const action = actualizarProducto.bind(null, params.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <Link href={`/inventario/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al producto
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Editar {producto.nombre_comercial}
        </h1>
      </Reveal>

      <Reveal delay={0.05}>
        <ProductoForm action={action} producto={producto} laboratorios={laboratorios} submitLabel="Guardar cambios" />
      </Reveal>
    </div>
  );
}
