import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProductoForm } from "@/components/inventario/producto-form";
import { requireCapability } from "@/lib/auth/guard";
import { getLaboratorios } from "@/lib/data/inventory";
import { crearProducto } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo producto — JM Farmacia" };

export default async function NuevoProductoPage({ searchParams }: { searchParams: { codigo?: string } }) {
  await requireCapability("editar_inventario");
  const codigo = searchParams.codigo?.trim();
  const laboratorios = await getLaboratorios();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <Link href="/inventario" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al inventario
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo producto</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra un medicamento en el catálogo. El stock se agrega luego con una entrada de mercancía.
        </p>
      </Reveal>

      <Reveal delay={0.05}>
        <ProductoForm action={crearProducto} defaultCodigo={codigo} laboratorios={laboratorios} submitLabel="Crear producto" />
      </Reveal>
    </div>
  );
}
