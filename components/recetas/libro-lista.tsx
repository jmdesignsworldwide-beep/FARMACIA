"use client";

import Link from "next/link";
import { BookLock, ChevronRight } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import type { LibroEntry } from "@/lib/data/recetas-shared";

const fmt = (d: string) => new Date(d).toLocaleString("es-DO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function LibroLista({ entries }: { entries: LibroEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-2 rounded-2xl p-12 text-center shadow-elev-1">
        <BookLock className="h-9 w-9 text-muted-foreground" />
        <p className="text-sm font-medium">Libro vacío</p>
        <p className="text-xs text-muted-foreground">Los despachos de controlados se asentarán aquí.</p>
      </div>
    );
  }
  return (
    <Stagger className="space-y-2.5">
      {entries.map((e) => (
        <StaggerItem key={e.id}>
          <Link href={`/recetas/libro/${e.id}`} className="group flex items-center gap-3 rounded-2xl glass p-3.5 shadow-elev-1 transition-shadow hover:shadow-elev-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-danger/12 text-danger">
              <BookLock className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{e.producto_nombre} <span className="tabular font-normal text-muted-foreground">× {e.cantidad}</span></p>
              <p className="truncate text-xs text-muted-foreground">
                {e.paciente_nombre ?? "—"} · receta {e.numero_receta ?? "S/N"} · despachó {e.empleado_nombre ?? "—"} · {fmt(e.created_at)}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
