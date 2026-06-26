"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Recetas", href: "/recetas" },
  { label: "Libro de controlados", href: "/recetas/libro" },
  { label: "Reportes", href: "/recetas/reportes" },
];

export function RecetasNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-border/70 bg-card/40 p-1">
      {TABS.map((t) => {
        const active = pathname === t.href || (t.href !== "/recetas" && pathname.startsWith(t.href));
        return (
          <Link key={t.href} href={t.href}
            className={cn("relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {active && <motion.span layoutId="recetas-tab" className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-primary to-accent" transition={{ type: "spring", stiffness: 320, damping: 30 }} />}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
