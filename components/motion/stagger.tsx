"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Entrada en cascada (stagger) con spring.
 * Envuelve hijos en <StaggerItem> para que aparezcan secuencialmente.
 */
export function Stagger({
  className,
  children,
  delay = 0,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduce ? 0 : 0.07,
            delayChildren: reduce ? 0 : delay,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  className,
  children,
  ...props
}: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", stiffness: 260, damping: 24 },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
