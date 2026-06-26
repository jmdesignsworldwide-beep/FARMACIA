import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Phone, Mail, Hash, MapPin, Boxes, Package } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { VencimientoBadge } from "@/components/inventario/badges";
import { Button } from "@/components/ui/button";
import { requireCapability } from "@/lib/auth/guard";
import { can } from "@/lib/auth/roles";
import { getProveedor, getProveedorLotes, tipoProveedorLabel } from "@/lib/data/proveedores";
import { formatRD } from "@/lib/utils";

export const dynamic = "force-dynamic";

const diasPara = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);

export default async function ProveedorDetallePage({ params }: { params: { id: string } }) {
  const emp = await requireCapability("ver_proveedores");
  const proveedor = await getProveedor(params.id);
  if (!proveedor) notFound();
  const lotes = await getProveedorLotes(proveedor);
  const totalSurtido = lotes.reduce((s, l) => s + l.costo_total, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Reveal>
        <Link href="/proveedores" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a proveedores
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{proveedor.nombre}</h1>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{tipoProveedorLabel(proveedor.tipo)}</span>
            </div>
          </div>
          {can(emp.rol, "gestionar_proveedores") && (
            <Link href={`/proveedores/${proveedor.id}/editar`}><Button size="sm"><Pencil className="h-4 w-4" /> Editar</Button></Link>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className="glass grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl p-5 shadow-elev-1 sm:grid-cols-4">
          <Dato icon={<Phone className="h-4 w-4" />} label="Teléfono" value={proveedor.telefono ?? "—"} />
          <Dato icon={<Mail className="h-4 w-4" />} label="Email" value={proveedor.email ?? "—"} />
          <Dato icon={<Hash className="h-4 w-4" />} label="RNC" value={proveedor.rnc ?? "—"} />
          <Dato icon={<MapPin className="h-4 w-4" />} label="Dirección" value={proveedor.direccion ?? "—"} />
        </div>
      </Reveal>

      {/* Resumen surtido */}
      <Reveal>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4 shadow-elev-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Boxes className="h-4 w-4" /> Lotes surtidos</p>
            <p className="tabular mt-1 text-2xl font-semibold"><CountUp value={lotes.length} /></p>
          </div>
          <div className="glass rounded-2xl p-4 shadow-elev-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Package className="h-4 w-4" /> Valor surtido</p>
            <p className="tabular mt-1 text-2xl font-semibold"><CountUp value={totalSurtido} currency /></p>
          </div>
        </div>
      </Reveal>

      {/* Lotes surtidos (reales) */}
      <Reveal>
        <div className="glass rounded-2xl p-5 shadow-elev-1">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Lotes que ha surtido</h2>
          {lotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no ha surtido lotes. Regístralo en una entrada de mercancía.</p>
          ) : (
            <Stagger className="space-y-2">
              {lotes.map((l) => (
                <StaggerItem key={l.id}>
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.producto} <span className="tabular font-normal text-muted-foreground">· lote {l.numero_lote}</span></p>
                      <p className="text-xs text-muted-foreground">Entró {new Date(l.fecha_entrada).toLocaleDateString("es-DO")} · {l.cantidad} uds · {formatRD(l.costo_total)}</p>
                    </div>
                    <VencimientoBadge dias={diasPara(l.fecha_vencimiento)} />
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </Reveal>

      {proveedor.notas && (
        <Reveal><div className="glass rounded-2xl p-5 shadow-elev-1"><h2 className="mb-1 text-sm font-semibold tracking-tight">Notas</h2><p className="text-sm text-muted-foreground">{proveedor.notas}</p></div></Reveal>
      )}
    </div>
  );
}

function Dato({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</p>
      <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
