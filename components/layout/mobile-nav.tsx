"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

/**
 * Menú hamburguesa para móvil. El drawer se renderiza con un PORTAL a
 * document.body para evitar que el `backdrop-filter` del header (glass)
 * lo recorte: un ancestro con backdrop-filter se vuelve el containing block
 * de los hijos `position: fixed`, lo que limitaba el panel al alto del header.
 * Siempre se puede cerrar (X, fondo, Escape, o al navegar).
 */
export function MobileNav({ rol, nombre, adminDemo }: { rol: string; nombre?: string; adminDemo?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const drawer = (
    <AnimatePresence>
      {open && (
        <div className="lg:hidden">
          <motion.div
            className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="glass-strong fixed left-0 top-0 z-[70] flex h-[100dvh] w-[82%] max-w-xs flex-col gap-5 px-4 shadow-elev-3"
            style={{
              paddingTop: "max(1.25rem, env(safe-area-inset-top))",
              paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
            }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <div className="flex shrink-0 items-center justify-between px-2">
              <Brand name={nombre} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="-mr-1 flex-1 overflow-y-auto overscroll-contain pr-1">
              <NavLinks rol={rol} adminDemo={adminDemo} onNavigate={() => setOpen(false)} />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

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

      {mounted ? createPortal(drawer, document.body) : null}
    </div>
  );
}
