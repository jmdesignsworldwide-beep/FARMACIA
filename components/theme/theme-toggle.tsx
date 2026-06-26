"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

/** Toggle sol/luna con transición suave. La elección persiste (localStorage). */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const reduce = useReducedMotion();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
      className={cn(
        "relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl",
        "border border-border bg-card/50 text-foreground shadow-elev-1",
        "transition-colors hover:bg-muted",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -45, y: 6 }}
          animate={{ opacity: 1, rotate: 0, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 45, y: -6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="grid place-items-center"
        >
          {isDark ? (
            <Moon className="h-[18px] w-[18px] text-accent" />
          ) : (
            <Sun className="h-[18px] w-[18px] text-primary" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
