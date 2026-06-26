"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

/**
 * Menú hamburguesa para móvil. Abre un drawer que SIEMPRE se puede cerrar
 * (botón X, tocar el fondo, o navegar). Nunca deja a la usuaria atrapada.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  // Bloquea el scroll del fondo mientras el drawer está abierto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Cerrar con la tecla Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card/50 text-foreground shadow-elev-1 transition-colors hover:bg-muted"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="glass-strong fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col gap-6 px-4 py-6 shadow-elev-3"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
            >
              <div className="flex items-center justify-between px-2">
                <Brand />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                  className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
