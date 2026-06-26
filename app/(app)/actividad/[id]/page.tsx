import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, User, Hash } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { RolBadge } from "@/components/empleados/rol-badge";
import { SelloInviolable } from "@/components/empleados/sello-inviolable";
import { requireCapability } from "@/lib/auth/guard";
import { getActividadEvento } from "@/lib/data/empleados";
import { tipoLabel } from "@/lib/data/actividad-shared";

export const dynamic = "force-dynamic";

export default async function EventoPage({ params }: { params: { id: string } }) {
  await requireCapability("ver_historial");
  const ev = await getActividadEvento(params.id);
  if (!ev) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Reveal>
        <Link href="/actividad" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al historial
        </Link>
        <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{ev.descripcion}</h1>
        <div className="mt-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{tipoLabel(ev.tipo)}</span>
        </div>
      </Reveal>

      <Reveal>
        <div className="glass space-y-3 rounded-2xl p-5 shadow-elev-1">
          <Linea icon={<User className="h-4 w-4" />} label="Realizado por">
            <span className="font-medium">{ev.empleado_nombre ?? "Sistema"}</span>
            {ev.rol && <RolBadge rol={ev.rol} className="ml-2" />}
          </Linea>
          <Linea icon={<Clock className="h-4 w-4" />} label="Fecha y hora">
            {new Date(ev.created_at).toLocaleString("es-DO", { dateStyle: "long", timeStyle: "medium" })}
          </Linea>
          {ev.ref_tabla && (
            <Linea icon={<Hash className="h-4 w-4" />} label="Referencia">
              <span className="tabular font-mono text-xs">{ev.ref_tabla}{ev.ref_id ? ` · ${ev.ref_id.slice(0, 8)}` : ""}</span>
            </Linea>
          )}
          {ev.detalle && Object.keys(ev.detalle).length > 0 && (
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Detalle</p>
              <dl className="space-y-1 rounded-xl border border-border/60 bg-card/40 p-3 text-sm">
                {Object.entries(ev.detalle).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="tabular truncate font-medium">{String(v ?? "—")}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal><SelloInviolable /></Reveal>
    </div>
  );
}

function Linea({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">{icon} {label}</span>
      <span className="flex items-center text-right">{children}</span>
    </div>
  );
}
