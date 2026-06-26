"use client";

import Link from "next/link";
import { FileText, ChevronRight, ShieldAlert, Clock, CheckCircle2 } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { recetaVencida } from "@/lib/data/recetas-shared";
import type { RecetaResumen } from "@/lib/data/recetas-shared";

const fmt = (d: string) => new Date(d).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" });

export function RecetaLista({ recetas }: { recetas: RecetaResumen[] }) {
  if (recetas.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-2 rounded-2xl p-12 text-center shadow-elev-1">
        <FileText className="h-9 w-9 text-muted-foreground" />
        <p className="text-sm font-medium">Sin recetas</p>
        <p className="text-xs text-muted-foreground">Registra la primera con sus medicamentos.</p>
      </div>
    );
  }
  return (
    <Stagger className="grid grid-cols-1 gap-3">
      {recetas.map((r) => {
        const vencida = recetaVencida(r);
        return (
          <StaggerItem key={r.id}>
            <Link href={`/recetas/${r.id}`} className="group flex items-center gap-4 rounded-2xl glass p-4 shadow-elev-1 transition-shadow hover:shadow-elev-2">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold tracking-tight">{r.paciente_nombre}</span>
                  <span className="tabular text-xs text-muted-foreground">#{r.numero}</span>
                  {r.controlada && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger"><ShieldAlert className="h-3 w-3" /> Controlada</span>
                  )}
                  {r.estado === "despachada" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success"><CheckCircle2 className="h-3 w-3" /> Despachada</span>
                  ) : vencida ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning"><Clock className="h-3 w-3" /> Vencida</span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {r.medico_nombre} · {r.items_count} {r.items_count === 1 ? "medicamento" : "medicamentos"} · {fmt(r.fecha)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
