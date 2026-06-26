"use client";

import Link from "next/link";
import { Bike, ChevronRight, MapPin } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { PulseDot } from "@/components/motion/pulse-dot";
import { estadoMeta } from "@/lib/data/deliveries-shared";
import { formatRD, cn } from "@/lib/utils";
import type { Delivery } from "@/lib/data/deliveries-shared";

export function DeliveryLista({ deliveries }: { deliveries: Delivery[] }) {
  if (deliveries.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-2 rounded-2xl p-12 text-center shadow-elev-1">
        <Bike className="h-9 w-9 text-muted-foreground" />
        <p className="text-sm font-medium">Sin deliveries</p>
        <p className="text-xs text-muted-foreground">Crea el primero o espera asignaciones.</p>
      </div>
    );
  }
  return (
    <Stagger className="grid grid-cols-1 gap-3">
      {deliveries.map((d) => {
        const m = estadoMeta(d.estado);
        return (
          <StaggerItem key={d.id}>
            <Link href={`/deliveries/${d.id}`} className="group flex items-center gap-4 rounded-2xl glass p-4 shadow-elev-1 transition-shadow hover:shadow-elev-2">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><Bike className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold tracking-tight">#{d.folio} · {d.cliente_nombre}</span>
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", m.cls)}>
                    {(d.estado === "pendiente" || d.estado === "en_camino") && <PulseDot tone={m.dot as any} />}
                    {m.label}
                  </span>
                </div>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" /> {d.sector ?? d.direccion}{d.motorista_nombre ? ` · ${d.motorista_nombre}` : " · sin asignar"}
                </p>
              </div>
              <span className="tabular shrink-0 text-sm font-semibold">{formatRD(d.monto)}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
