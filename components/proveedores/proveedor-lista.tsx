"use client";

import Link from "next/link";
import { Truck, ChevronRight, Phone } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { tipoProveedorLabel } from "@/lib/data/proveedores-shared";
import type { Proveedor } from "@/lib/data/proveedores-shared";

export function ProveedorLista({ proveedores }: { proveedores: Proveedor[] }) {
  if (proveedores.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-2 rounded-2xl p-12 text-center shadow-elev-1">
        <Truck className="h-9 w-9 text-muted-foreground" />
        <p className="text-sm font-medium">Sin proveedores</p>
        <p className="text-xs text-muted-foreground">Registra el primero.</p>
      </div>
    );
  }
  return (
    <Stagger className="grid grid-cols-1 gap-3">
      {proveedores.map((p) => (
        <StaggerItem key={p.id}>
          <Link href={`/proveedores/${p.id}`} className="group flex items-center gap-4 rounded-2xl glass p-4 shadow-elev-1 transition-shadow hover:shadow-elev-2">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><Truck className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold tracking-tight">{p.nombre}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{tipoProveedorLabel(p.tipo)}</span>
              </div>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                {p.telefono && <><Phone className="h-3 w-3" /> {p.telefono}</>}{p.rnc ? ` · RNC ${p.rnc}` : ""}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
