"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Modal premium reutilizable (overlay + panel con AnimatePresence). */
export function Modal({
  open,
  onClose,
  children,
  className,
  tone = "default",
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "danger";
  dismissable?: boolean;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!dismissable) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, dismissable]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className={cn(
              "absolute inset-0 backdrop-blur-sm",
              tone === "danger" ? "bg-danger/20" : "bg-background/70",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissable ? onClose : undefined}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              "glass-strong relative z-10 w-full max-w-lg rounded-3xl p-6 shadow-elev-3",
              className,
            )}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
