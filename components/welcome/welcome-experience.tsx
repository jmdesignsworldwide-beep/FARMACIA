"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Cross } from "lucide-react";

/**
 * Bienvenida cinematográfica (cortina que se levanta y revela el sistema).
 * A prueba de fallos: un temporizador duro SIEMPRE la cierra; tocar la salta.
 * El dashboard ya está montado por detrás (se navega antes de mostrarla).
 */
export function WelcomeExperience({
  nombre,
  farmacia,
  onDone,
}: {
  nombre: string;
  farmacia: string;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<"in" | "out">("in");
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    document.body.style.overflow = "";
    onDone();
  };

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    const hold = reduce ? 850 : 2300;
    const t1 = setTimeout(() => setStage("out"), hold);
    // Failsafe duro: pase lo que pase, nunca deja a nadie atascado.
    const t2 = setTimeout(finish, reduce ? 1500 : 3700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  if (!mounted) return null;

  // Nombre de la farmacia: primera palabra neutra, el resto en degradado de marca.
  const partes = farmacia.trim().split(" ");
  const primera = partes[0];
  const resto = partes.slice(1).join(" ");

  const blurIn = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4, delay: delay * 0.4 } }
      : {
          initial: { opacity: 0, filter: "blur(16px)", y: 14 },
          animate: { opacity: 1, filter: "blur(0px)", y: 0 },
          transition: { duration: 0.95, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  const curtainExit = reduce
    ? { opacity: 0, transition: { duration: 0.5 } }
    : { y: "-100%", transition: { duration: 0.8, delay: 0.25, ease: [0.76, 0, 0.24, 1] as const } };

  const overlay = (
    <motion.div
      role="dialog"
      aria-label={`Bienvenido a ${farmacia}`}
      onClick={() => setStage("out")}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background"
      initial={false}
      animate={stage === "out" ? curtainExit : { y: 0, opacity: 1 }}
      onAnimationComplete={() => stage === "out" && finish()}
    >
      {/* Aurora con profundidad (reusa los tokens del tema, respira) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: 0.85 }}>
        <div className="absolute -left-[10%] top-[-12%] h-[60vmax] w-[60vmax] animate-aurora-slow animate-breathe rounded-full blur-[90px]"
          style={{ background: "radial-gradient(circle at center, hsl(var(--aurora-1) / 0.85), transparent 62%)" }} />
        <div className="absolute right-[-12%] top-[4%] h-[55vmax] w-[55vmax] animate-aurora-slower rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle at center, hsl(var(--aurora-2) / 0.8), transparent 60%)" }} />
        <div className="absolute bottom-[-20%] left-[18%] h-[55vmax] w-[55vmax] animate-aurora-slow animate-breathe rounded-full blur-[110px]"
          style={{ background: "radial-gradient(circle at center, hsl(var(--aurora-3) / 0.78), transparent 64%)" }} />
      </div>
      {/* Viñeta para dar foco al centro */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 35%, hsl(var(--background) / 0.55) 100%)" }} />

      {/* Contenido */}
      <motion.div
        className="relative flex flex-col items-center px-6 text-center"
        animate={{ opacity: stage === "out" ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo con anillos + glow */}
        <div className="relative grid place-items-center">
          {!reduce && [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full border border-primary/30"
              style={{ width: 96, height: 96 }}
              initial={{ scale: 0.7, opacity: 0.45 }}
              animate={{ scale: [0.7, 1.9], opacity: [0.45, 0] }}
              transition={{ duration: 2.4, delay: i * 0.7, repeat: Infinity, ease: "easeOut" }}
            />
          ))}
          <motion.span
            className="relative grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-glow"
            initial={reduce ? { opacity: 0 } : { scale: 0.6, opacity: 0, rotate: -8 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Cross className="h-12 w-12 text-primary-foreground" strokeWidth={2.5} />
          </motion.span>
        </div>

        {/* Saludo */}
        <motion.p {...blurIn(0.5)} className="mt-8 text-sm font-medium tracking-wide text-muted-foreground sm:text-base">
          Bienvenido de nuevo, <span className="text-foreground">{nombre}</span>
        </motion.p>

        {/* Nombre de la farmacia — protagonista en degradado de marca */}
        <motion.h1 {...blurIn(0.85)} className="mt-2 text-4xl font-bold tracking-tight sm:text-6xl">
          {primera} {resto && <span className="text-gradient-brand">{resto}</span>}
        </motion.h1>

        <motion.p {...blurIn(1.25)} className="mt-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-primary/60" />
          Tu sistema, con alma
          <span className="h-px w-6 bg-gradient-to-l from-transparent to-accent/60" />
        </motion.p>
      </motion.div>

      {/* Failsafe visible: tocar para entrar */}
      <motion.button
        type="button"
        onClick={() => setStage("out")}
        className="absolute bottom-8 text-[11px] text-muted-foreground/60 transition-colors hover:text-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === "out" ? 0 : 1 }}
        transition={{ delay: reduce ? 0.4 : 1.6, duration: 0.5 }}
      >
        Toca para entrar
      </motion.button>
    </motion.div>
  );

  return createPortal(overlay, document.body);
}
