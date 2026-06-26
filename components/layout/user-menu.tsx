"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { signOut } from "@/app/(app)/actions";
import { cn } from "@/lib/utils";

/** Menú de usuario/perfil con cierre de sesión. */
export function UserMenu({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-border bg-card/50 py-1.5 pl-1.5 pr-2.5 shadow-elev-1 transition-colors hover:bg-muted"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <UserRound className="h-4 w-4" />
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:block">
          {username}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="menu"
            className="glass-strong absolute right-0 mt-2 w-52 overflow-hidden rounded-xl p-1.5 shadow-elev-3"
          >
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">Sesión iniciada</p>
              <p className="truncate text-sm font-medium">{username}</p>
            </div>
            <div className="my-1 h-px bg-border" />
            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
