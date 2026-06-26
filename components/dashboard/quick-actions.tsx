"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShoppingCart,
  PackagePlus,
  Boxes,
  Calculator,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Magnetic } from "@/components/motion/magnetic";
import { cn } from "@/lib/utils";

type Action = {
  label: string;
  href: string;
  icon: LucideIcon;
  hint: string;
};

const ACTIONS: Action[] = [
  { label: "Entrada de mercancía", href: "/inventario/entrada", icon: PackagePlus, hint: "Recibir pedido" },
  { label: "Ver inventario", href: "/inventario", icon: Boxes, hint: "Catálogo y lotes" },
  { label: "Cierre de caja", href: "/reportes", icon: Calculator, hint: "Cuadre del día" },
];

export function QuickActions() {
  const reduce = useReducedMotion();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Acción protagonista: Nueva venta */}
      <Magnetic strength={0.2} className="md:col-span-1">
        <Link
          href="/ventas"
          className="group relative flex h-full min-h-[7.5rem] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent p-5 text-primary-foreground shadow-elev-2 transition-shadow hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl"
            animate={reduce ? {} : { opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/20">
            <ShoppingCart className="h-5 w-5" />
          </span>
          <div className="relative flex items-end justify-between">
            <div>
              <p className="text-lg font-semibold tracking-tight">Nueva venta</p>
              <p className="text-sm text-primary-foreground/80">Abrir punto de venta</p>
            </div>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </Magnetic>

      {/* Acciones secundarias */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:col-span-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Magnetic key={a.href} strength={0.16}>
              <Link
                href={a.href}
                className={cn(
                  "group flex h-full min-h-[7.5rem] flex-col justify-between rounded-2xl glass p-4",
                  "shadow-elev-1 transition-shadow hover:shadow-elev-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary/20">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-tight">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.hint}</p>
                </div>
              </Link>
            </Magnetic>
          );
        })}
      </div>
    </div>
  );
}
