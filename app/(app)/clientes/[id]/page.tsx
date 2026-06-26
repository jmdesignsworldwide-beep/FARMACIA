import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Phone, IdCard, Cake, Star, ShieldAlert, Receipt, FileText, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { requireCapability } from "@/lib/auth/guard";
import { can } from "@/lib/auth/roles";
import { getCliente, getClienteCompras, getClienteRecetas, edad } from "@/lib/data/clientes";
import { metodoLabel } from "@/lib/data/ventas-shared";
import { formatRD } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClienteDetallePage({ params }: { params: { id: string } }) {
  const emp = await requireCapability("ver_clientes");
  const cliente = await getCliente(params.id);
  if (!cliente) notFound();
  const [compras, recetas] = await Promise.all([getClienteCompras(cliente.id), getClienteRecetas(cliente)]);
  const totalComprado = compras.filter((c) => c.estado === "completada").reduce((s, c) => s + Number(c.total), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Reveal>
        <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a clientes
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{cliente.nombre}</h1>
              {cliente.frecuente && <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><Star className="h-3.5 w-3.5" /> Frecuente</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{compras.length} compras · {formatRD(totalComprado)} en total</p>
          </div>
          {can(emp.rol, "gestionar_clientes") && (
            <Link href={`/clientes/${cliente.id}/editar`}><Button size="sm"><Pencil className="h-4 w-4" /> Editar</Button></Link>
          )}
        </div>
      </Reveal>

      {/* Alerta de alergias */}
      {cliente.alergias.length > 0 && (
        <Reveal>
          <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p><strong>Alergias registradas:</strong> {cliente.alergias.join(", ")}. Verifica antes de despachar.</p>
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="glass grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl p-5 shadow-elev-1 sm:grid-cols-4">
          <Dato icon={<IdCard className="h-4 w-4" />} label="Cédula" value={cliente.cedula ?? "—"} />
          <Dato icon={<Phone className="h-4 w-4" />} label="Teléfono" value={cliente.telefono ?? "—"} />
          <Dato icon={<Cake className="h-4 w-4" />} label="Edad" value={edad(cliente.fecha_nacimiento) ? `${edad(cliente.fecha_nacimiento)} años` : "—"} />
          <Dato icon={<Receipt className="h-4 w-4" />} label="Balance" value={cliente.balance > 0 ? formatRD(cliente.balance) : "Al día"} />
        </div>
      </Reveal>

      {/* Compras */}
      <Reveal>
        <div className="glass rounded-2xl p-5 shadow-elev-1">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight"><Receipt className="h-4 w-4" /> Historial de compras</h2>
          {compras.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no tiene compras asociadas. Asócialo a una venta en el POS.</p>
          ) : (
            <ul className="space-y-2">
              {compras.map((c) => (
                <li key={c.id}>
                  <Link href={`/ventas/historial/${c.id}`} className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 transition-colors hover:bg-muted">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Venta #{c.folio} {c.estado === "anulada" && <span className="text-xs text-danger">(anulada)</span>}</p>
                      <p className="text-xs text-muted-foreground">{metodoLabel(c.metodo_pago)} · {new Date(c.created_at).toLocaleDateString("es-DO")}</p>
                    </div>
                    <span className="tabular text-sm font-semibold">{formatRD(c.total)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      {/* Recetas */}
      {recetas.length > 0 && (
        <Reveal>
          <div className="glass rounded-2xl p-5 shadow-elev-1">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight"><FileText className="h-4 w-4" /> Recetas</h2>
            <ul className="space-y-2">
              {recetas.map((r) => (
                <li key={r.id}>
                  <Link href={`/recetas/${r.id}`} className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 transition-colors hover:bg-muted">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">#{r.numero} · {r.medico_nombre}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.fecha).toLocaleDateString("es-DO")}{r.controlada ? " · controlada" : ""}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      )}

      {cliente.notas && (
        <Reveal>
          <div className="glass rounded-2xl p-5 shadow-elev-1">
            <h2 className="mb-1 text-sm font-semibold tracking-tight">Notas internas</h2>
            <p className="text-sm text-muted-foreground">{cliente.notas}</p>
          </div>
        </Reveal>
      )}
    </div>
  );
}

function Dato({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
