import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProveedorForm } from "@/components/proveedores/proveedor-form";
import { requireCapability } from "@/lib/auth/guard";
import { crearProveedor } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo proveedor — JM Farmacia" };

export default async function NuevoProveedorPage() {
  await requireCapability("gestionar_proveedores");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <Link href="/proveedores" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a proveedores
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo proveedor</h1>
      </Reveal>
      <Reveal delay={0.05}><ProveedorForm action={crearProveedor} /></Reveal>
    </div>
  );
}
