"use client";

import Link from "next/link";
import { UserRound, ChevronRight, Users } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { RolBadge } from "./rol-badge";
import type { Empleado } from "@/lib/data/empleados";

export function EmpleadoLista({ empleados }: { empleados: Empleado[] }) {
  if (empleados.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-2 rounded-2xl p-12 text-center shadow-elev-1">
        <Users className="h-9 w-9 text-muted-foreground" />
        <p className="text-sm font-medium">Sin empleados</p>
        <p className="text-xs text-muted-foreground">Crea el primero con su rol y credenciales.</p>
      </div>
    );
  }
  return (
    <Stagger className="grid grid-cols-1 gap-3">
      {empleados.map((e) => (
        <StaggerItem key={e.id}>
          <Link href={`/empleados/${e.id}`} className="group flex items-center gap-4 rounded-2xl glass p-4 shadow-elev-1 transition-shadow hover:shadow-elev-2">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <UserRound className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold tracking-tight">{e.full_name ?? e.username}</span>
                <RolBadge rol={e.rol} />
                {!e.activo && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Inactivo</span>}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                @{e.username}{e.cargo ? ` · ${e.cargo}` : ""}{e.cedula ? ` · ${e.cedula}` : ""}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
