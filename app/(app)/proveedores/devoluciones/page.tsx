import { Info } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProveedoresNav } from "@/components/proveedores/proveedores-nav";
import { DevolucionesLista } from "@/components/proveedores/devoluciones-lista";
import { requireCapability } from "@/lib/auth/guard";
import { DEVOLUCIONES_DEMO } from "@/lib/data/compras-navegable";

export const dynamic = "force-dynamic";

export default async function DevolucionesPage() {
  await requireCapability("ver_proveedores");

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Devoluciones a proveedores</h1>
        <p className="mt-1 text-sm text-muted-foreground">Productos devueltos por vencimiento, daño o error.</p>
      </Reveal>

      <ProveedoresNav />

      <DevolucionesLista devoluciones={DEVOLUCIONES_DEMO} />

      <Reveal>
        <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Flujo de devoluciones y adjunto de facturas de demostración. La operación completa se configura en producción.</p>
        </div>
      </Reveal>
    </div>
  );
}
