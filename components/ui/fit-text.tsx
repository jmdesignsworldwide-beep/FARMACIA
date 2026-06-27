"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Ajusta automáticamente el contenido (un monto, una cifra) para que SIEMPRE
 * quepa dentro de su contenedor, sin importar cuántos dígitos tenga. Si el
 * texto es más ancho que el espacio disponible, lo escala hacia abajo con un
 * transform (mantiene tabular-nums y el degradado). Reacciona a cambios de
 * tamaño del contenedor y del propio texto (p. ej. durante un count-up).
 */
export function FitText({
  children,
  className,
  textClassName,
}: {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner) return;

    const medir = () => {
      const disponible = box.clientWidth;
      const natural = inner.scrollWidth;
      if (natural > 0 && disponible > 0) {
        setScale(natural > disponible ? disponible / natural : 1);
      }
    };

    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(box);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className={cn("w-full overflow-hidden", className)}>
      <span
        ref={innerRef}
        className={cn("inline-block origin-left whitespace-nowrap will-change-transform", textClassName)}
        style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}
      >
        {children}
      </span>
    </div>
  );
}
