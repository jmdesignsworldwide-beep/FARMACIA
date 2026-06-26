"use client";

import Link from "next/link";
import { PackageSearch, ChevronRight } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { CountUp } from "@/components/motion/count-up";
import {
  ControladoBadge,
  RecetaBadge,
  BajoStockBadge,
  VencimientoBadge,
} from "./badges";
import { formatRD } from "@/lib/utils";
import type { ProductoConStock } from "@/lib/data/inventory";

function diasPara(fecha: string | null): number | null {
  if (!fecha) return null;
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000);
}

export function ProductoLista({ productos }: { productos: ProductoConStock[] }) {
  if (productos.length === 0) {
    return (
      <div className="glass flex flex-col items-center justify-center gap-2 rounded-2xl p-12 text-center shadow-elev-1">
        <PackageSearch className="h-9 w-9 text-muted-foreground" />
        <p className="text-sm font-medium">Sin resultados</p>
        <p className="text-xs text-muted-foreground">
          Ajusta la búsqueda o los filtros, o crea un producto nuevo.
        </p>
      </div>
    );
  }

  return (
    <Stagger className="grid grid-cols-1 gap-3">
      {productos.map((p) => {
        const dias = diasPara(p.proximo_vencimiento);
        return (
          <StaggerItem key={p.id}>
            <Link
              href={`/inventario/${p.id}`}
              className="group flex items-center gap-4 rounded-2xl glass p-4 shadow-elev-1 transition-shadow hover:shadow-elev-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold tracking-tight">{p.nombre_comercial}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {p.nombre_generico}
                    {p.concentracion ? ` · ${p.concentracion}` : ""}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {p.categoria}
                  </span>
                  {p.controlado && <ControladoBadge />}
                  {p.requiere_receta && <RecetaBadge />}
                  {p.bajo_stock && <BajoStockBadge />}
                  {dias !== null && dias <= 90 && <VencimientoBadge dias={dias} />}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="tabular text-xl font-semibold leading-none">
                  <CountUp value={p.stock_total} />
                </p>
                <p className="text-[11px] text-muted-foreground">en stock</p>
                <p className="tabular mt-1 text-sm font-medium text-primary">
                  {formatRD(p.precio_venta)}
                </p>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
