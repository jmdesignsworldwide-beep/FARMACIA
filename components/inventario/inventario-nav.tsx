"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Productos", href: "/inventario" },
  { label: "Alertas", href: "/inventario/alertas" },
  { label: "Movimientos", href: "/inventario/movimientos" },
];

export function InventarioNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav className="flex gap-1 rounded-xl border border-border/70 bg-card/40 p-1">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="inv-tab"
                  className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-primary to-accent"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex gap-2">
        <Link href="/inventario/entrada">
          <Button variant="outline" size="sm">
            <PackagePlus className="h-4 w-4" /> Entrada
          </Button>
        </Link>
        <Link href="/inventario/nuevo">
          <Button size="sm">
            <Plus className="h-4 w-4" /> Nuevo producto
          </Button>
        </Link>
      </div>
    </div>
  );
}
