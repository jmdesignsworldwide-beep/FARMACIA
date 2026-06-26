"use client";

import Link from "next/link";
import {
  ShoppingCart, Ban, PackagePlus, SlidersHorizontal, Tag, Unlock, LockKeyhole,
  UserPlus, UserCog, ShieldX, FileText, ChevronRight, type LucideIcon,
} from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { tipoLabel } from "@/lib/data/actividad-shared";
import { cn } from "@/lib/utils";
import type { Actividad } from "@/lib/data/empleados";

const META: Record<string, { icon: LucideIcon; cls: string }> = {
  venta: { icon: ShoppingCart, cls: "bg-success/15 text-success" },
  venta_anulada: { icon: Ban, cls: "bg-danger/15 text-danger" },
  entrada_mercancia: { icon: PackagePlus, cls: "bg-primary/12 text-primary" },
  ajuste_inventario: { icon: SlidersHorizontal, cls: "bg-accent/15 text-accent" },
  receta_despachada: { icon: FileText, cls: "bg-accent/15 text-accent" },
  cambio_precio: { icon: Tag, cls: "bg-warning/15 text-warning" },
  caja_apertura: { icon: Unlock, cls: "bg-primary/12 text-primary" },
  caja_cierre: { icon: LockKeyhole, cls: "bg-primary/12 text-primary" },
  empleado_creado: { icon: UserPlus, cls: "bg-success/15 text-success" },
  empleado_editado: { icon: UserCog, cls: "bg-accent/15 text-accent" },
  acceso_denegado: { icon: ShieldX, cls: "bg-danger/15 text-danger" },
};

const fmt = (d: string) =>
  new Date(d).toLocaleString("es-DO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function ActividadLista({ items, showEmpleado = true }: { items: Actividad[]; showEmpleado?: boolean }) {
  if (items.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground shadow-elev-1">
        Aún no hay actividad registrada.
      </div>
    );
  }
  return (
    <Stagger className="space-y-2.5">
      {items.map((a) => {
        const m = META[a.tipo] ?? { icon: FileText, cls: "bg-muted text-muted-foreground" };
        const Icon = m.icon;
        return (
          <StaggerItem key={a.id}>
            <Link href={`/actividad/${a.id}`} className="group flex items-center gap-3 rounded-2xl glass p-3.5 shadow-elev-1 transition-shadow hover:shadow-elev-2">
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", m.cls)}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.descripcion}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{tipoLabel(a.tipo)}</span>
                  {showEmpleado && a.empleado_nombre ? ` · ${a.empleado_nombre}` : ""} · {fmt(a.created_at)}
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
