"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "./nav-items";
import { can } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

// Enlace de Capa B (JM Designs). NO se gatea por capacidad interna (Capa A),
// sino por el flag adminDemo que el servidor calcula desde demo_accesos.
const DEMO_ITEM: NavItem = { label: "Acceso demo", href: "/demo", icon: ShieldCheck, cap: "ver_dashboard" };

/** Lista de enlaces de navegación con resaltado del activo (pill animado). */
export function NavLinks({ rol, adminDemo, onNavigate }: { rol: string; adminDemo?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => can(rol, item.cap));
  if (adminDemo) items.push(DEMO_ITEM);

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-primary to-accent shadow-elev-2"
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
              />
            )}
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  active
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-background",
                )}
              >
                Pronto
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
