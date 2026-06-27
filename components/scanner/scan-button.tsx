"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScanLine, Camera, Keyboard, Loader2, CheckCircle2, Info } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Estado = "cargando" | "escaneando" | "denegado" | "error" | "ok";

/** Botón "Escanear" → abre la cámara y lee el código de barras. Respaldo manual. */
export function ScanButton({
  onDetected,
  label = "Escanear",
  variant = "outline",
}: {
  onDetected: (codigo: string) => void;
  label?: string;
  variant?: "outline" | "primary";
}) {
  const [open, setOpen] = useState(false);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [manual, setManual] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    setEstado("cargando");

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current!,
          (result) => {
            if (result && !cancelado) {
              const code = result.getText().trim();
              detener();
              setEstado("ok");
              setTimeout(() => {
                onDetected(code);
                cerrar();
              }, 450);
            }
          },
        );
        if (cancelado) { controls.stop(); return; }
        controlsRef.current = controls;
        setEstado("escaneando");
      } catch (e: any) {
        if (cancelado) return;
        const msg = String(e?.name ?? e?.message ?? "");
        setEstado(/NotAllowed|Permission|Denied/i.test(msg) ? "denegado" : "error");
      }
    })();

    return () => {
      cancelado = true;
      detener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function detener() {
    try { controlsRef.current?.stop(); } catch {}
    controlsRef.current = null;
  }
  function cerrar() {
    detener();
    setOpen(false);
    setManual("");
  }

  return (
    <>
      <Button type="button" variant={variant} onClick={() => setOpen(true)}>
        <ScanLine className="h-4 w-4" /> {label}
      </Button>

      <Modal open={open} onClose={cerrar} className="max-w-md">
        <div className="mb-3 flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Escanear código de barras</h2>
        </div>

        {(estado === "denegado" || estado === "error") ? (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm text-warning">
            <p className="flex items-start gap-1.5"><Info className="mt-0.5 h-4 w-4 shrink-0" />
              {estado === "denegado"
                ? "No se pudo acceder a la cámara (permiso denegado). Permite la cámara en tu navegador o escribe el código abajo."
                : "Tu dispositivo o navegador no permitió la cámara. Escribe el código abajo."}
            </p>
          </div>
        ) : (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            {/* Guía de escaneo */}
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className={cn("relative h-32 w-56 rounded-xl border-2", estado === "ok" ? "border-success" : "border-white/80")}>
                <span className="absolute -left-0.5 -top-0.5 h-5 w-5 rounded-tl-xl border-l-4 border-t-4 border-primary" />
                <span className="absolute -right-0.5 -top-0.5 h-5 w-5 rounded-tr-xl border-r-4 border-t-4 border-primary" />
                <span className="absolute -bottom-0.5 -left-0.5 h-5 w-5 rounded-bl-xl border-b-4 border-l-4 border-primary" />
                <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-br-xl border-b-4 border-r-4 border-primary" />
                {estado === "escaneando" && (
                  <motion.span className="absolute inset-x-2 h-0.5 rounded bg-primary shadow-glow"
                    initial={{ top: 8 }} animate={{ top: 116 }} transition={{ duration: 1.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} />
                )}
              </div>
            </div>
            {estado === "cargando" && (
              <div className="absolute inset-0 grid place-items-center bg-black/50 text-white">
                <span className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Abriendo cámara…</span>
              </div>
            )}
            {estado === "ok" && (
              <div className="absolute inset-0 grid place-items-center bg-success/20 text-success">
                <CheckCircle2 className="h-12 w-12" />
              </div>
            )}
          </div>
        )}

        {estado === "escaneando" && <p className="mt-2 text-center text-xs text-muted-foreground">Apunta al código de barras del producto.</p>}

        {/* Respaldo manual */}
        <div className="mt-4 border-t border-border/60 pt-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Keyboard className="h-3.5 w-3.5" /> O escribe el código manualmente</label>
          <div className="flex gap-2">
            <Input value={manual} onChange={(e) => setManual(e.target.value)} inputMode="numeric" placeholder="Ej. 7460010012345" />
            <Button type="button" onClick={() => { if (manual.trim()) { onDetected(manual.trim()); cerrar(); } }} disabled={!manual.trim()}>Usar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
