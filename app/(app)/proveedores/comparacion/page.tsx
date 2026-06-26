import { Info, BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { ProveedoresNav } from "@/components/proveedores/proveedores-nav";
import { requireCapability } from "@/lib/auth/guard";
import { getComparacionPrecios } from "@/lib/data/compras-navegable";
import { formatRD, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ComparacionPage() {
  await requireCapability("ver_proveedores");
  const filas = await getComparacionPrecios();
  const proveedores = filas[0]?.precios.map((p) => p.proveedor) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Comparación de precios</h1>
        <p className="mt-1 text-sm text-muted-foreground">Precio de costo por proveedor. El más bajo se resalta.</p>
      </Reveal>

      <ProveedoresNav />

      <Reveal>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Producto</th>
                {proveedores.map((p) => <th key={p} className="px-4 py-3 text-right font-medium">{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.producto} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 font-medium">{f.producto}</td>
                  {f.precios.map((p) => (
                    <td key={p.proveedor} className="px-4 py-3 text-right">
                      <span className={cn("tabular inline-flex items-center gap-1", p.proveedor === f.mejor ? "font-semibold text-success" : "")}>
                        {p.proveedor === f.mejor && <BadgeCheck className="h-3.5 w-3.5" />}
                        {formatRD(p.precio)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Reveal>

      <Reveal>
        <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Vista de demostración: la comparación con cotizaciones reales de proveedores se integra en producción.</p>
        </div>
      </Reveal>
    </div>
  );
}
