"use client";

import Link from "next/link";
import { Contact, ChevronRight, Star, ShieldAlert } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import type { Cliente } from "@/lib/data/clientes-shared";

export function ClienteLista({ clientes }: { clientes: Cliente[] }) {
  if (clientes.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-2 rounded-2xl p-12 text-center shadow-elev-1">
        <Contact className="h-9 w-9 text-muted-foreground" />
        <p className="text-sm font-medium">Sin clientes</p>
        <p className="text-xs text-muted-foreground">Registra el primero.</p>
      </div>
    );
  }
  return (
    <Stagger className="grid grid-cols-1 gap-3">
      {clientes.map((c) => (
        <StaggerItem key={c.id}>
          <Link href={`/clientes/${c.id}`} className="group flex items-center gap-4 rounded-2xl glass p-4 shadow-elev-1 transition-shadow hover:shadow-elev-2">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Contact className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold tracking-tight">{c.nombre}</span>
                {c.frecuente && <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"><Star className="h-3 w-3" /> Frecuente</span>}
                {c.alergias.length > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger"><ShieldAlert className="h-3 w-3" /> Alergias</span>}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {c.telefono ?? "Sin teléfono"}{c.cedula ? ` · ${c.cedula}` : ""}
                {c.balance > 0 ? ` · debe RD$ ${c.balance.toFixed(2)}` : ""}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
