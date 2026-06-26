"use client";

/**
 * Fondo aurora que "respira". Sutil en claro, protagonista en oscuro.
 * Solo decorativo (aria-hidden). El movimiento se detiene con reduced-motion
 * vía las reglas globales de animación.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ opacity: "var(--aurora-opacity)" }}
    >
      <div
        className="absolute -left-[12%] top-[-10%] h-[55vmax] w-[55vmax] animate-aurora-slow rounded-full blur-[90px] animate-breathe"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--aurora-1) / 0.9), transparent 62%)",
        }}
      />
      <div
        className="absolute right-[-14%] top-[8%] h-[50vmax] w-[50vmax] animate-aurora-slower rounded-full blur-[100px]"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--aurora-2) / 0.85), transparent 60%)",
        }}
      />
      <div
        className="absolute bottom-[-18%] left-[22%] h-[48vmax] w-[48vmax] animate-aurora-slow rounded-full blur-[110px] animate-breathe"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--aurora-3) / 0.8), transparent 64%)",
        }}
      />
    </div>
  );
}
