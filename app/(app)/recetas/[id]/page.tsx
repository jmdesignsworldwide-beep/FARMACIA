import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, FileCheck2, User, Stethoscope, CheckCircle2, Clock } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { DisclaimerControlados } from "@/components/recetas/disclaimer";
import { requireCapability } from "@/lib/auth/guard";
import { getReceta, recetaVencida } from "@/lib/data/recetas";

export const dynamic = "force-dynamic";

const fmt = (d: string) => new Date(d).toLocaleDateString("es-DO", { dateStyle: "long" });

export default async function RecetaDetallePage({ params }: { params: { id: string } }) {
  await requireCapability("ver_recetas");
  const data = await getReceta(params.id);
  if (!data) notFound();
  const { receta: r, items } = data;
  const vencida = recetaVencida(r);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Reveal>
        <Link href="/recetas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a recetas
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Receta #{r.numero}</h1>
          {r.controlada && <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger"><ShieldAlert className="h-3.5 w-3.5" /> Controlada</span>}
          {r.estado === "despachada" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Despachada</span>
          ) : vencida ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning"><Clock className="h-3.5 w-3.5" /> Vencida</span>
          ) : null}
        </div>
      </Reveal>

      <Reveal>
        <div className="glass grid grid-cols-1 gap-4 rounded-2xl p-5 shadow-elev-1 sm:grid-cols-2">
          <Dato icon={<Stethoscope className="h-4 w-4" />} label="Médico" value={r.medico_nombre} sub={r.medico_colegiatura ?? undefined} />
          <Dato icon={<User className="h-4 w-4" />} label="Paciente" value={r.paciente_nombre} sub={r.paciente_cedula ?? undefined} />
          <Dato icon={<Clock className="h-4 w-4" />} label="Fecha" value={fmt(r.fecha)} />
          <Dato icon={<FileCheck2 className="h-4 w-4" />} label="Origen" value={r.origen === "pos" ? "Despacho en POS" : "Registro manual"} />
        </div>
      </Reveal>

      <Reveal>
        <div className="glass rounded-2xl p-5 shadow-elev-1">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Medicamentos</h2>
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">{it.cantidad}× {it.nombre_medicamento}
                    {it.controlado && <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger"><ShieldAlert className="h-2.5 w-2.5" /> Controlado</span>}
                  </p>
                  {it.indicaciones && <p className="text-xs text-muted-foreground">{it.indicaciones}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      {r.foto_url && (
        <Reveal>
          <div className="glass flex items-center gap-3 rounded-2xl p-5 shadow-elev-1">
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-primary"><FileCheck2 className="h-7 w-7" /></div>
            <div><p className="text-sm font-medium">receta_adjunta.jpg</p><p className="text-[11px] text-muted-foreground">Vista de demostración del adjunto.</p></div>
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="glass flex flex-wrap items-center justify-between gap-2 rounded-2xl p-5 shadow-elev-1">
          <p className="text-sm text-muted-foreground">{r.estado === "despachada" ? "Despachada por" : "Registrada por"}</p>
          <p className="text-sm font-semibold">{r.empleado_nombre ?? "—"}</p>
        </div>
      </Reveal>

      {r.controlada && <Reveal><DisclaimerControlados /></Reveal>}
    </div>
  );
}

function Dato({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
