import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { EntradaForm } from "@/components/inventario/entrada-form";
import { getProductosBasico } from "@/lib/data/inventory";
import { getProveedoresBasico } from "@/lib/data/proveedores";
import { requireCapability } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrada de mercancía — JM Farmacia" };

export default async function EntradaPage({
  searchParams,
}: {
  searchParams: { producto?: string };
}) {
  await requireCapability("editar_inventario");
  const [productos, proveedores] = await Promise.all([
    getProductosBasico(),
    getProveedoresBasico(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <Link href="/inventario" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al inventario
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Entrada de mercancía</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra un lote nuevo. Sube el stock del producto y queda en el historial de movimientos.
        </p>
      </Reveal>

      <Reveal delay={0.05}>
        <EntradaForm productos={productos} proveedores={proveedores} defaultProductoId={searchParams.producto} />
      </Reveal>
    </div>
  );
}
