"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X, Loader2, Package, Contact, Receipt, Users, Truck, CornerDownLeft } from "lucide-react";
import { buscarGlobal } from "@/app/(app)/search-actions";
import { type SearchGrupo, type SearchTipo } from "@/lib/data/busqueda-shared";
import { cn } from "@/lib/utils";

const ICONO: Record<SearchTipo, typeof Package> = {
  producto: Package,
  cliente: Contact,
  venta: Receipt,
  empleado: Users,
  proveedor: Truck,
};

/** Resalta el término dentro de un texto. */
function Resaltar({ texto, q }: { texto: string; q: string }) {
  const t = q.trim();
  if (!t) return <>{texto}</>;
  const i = texto.toLowerCase().indexOf(t.toLowerCase());
  if (i < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i)}
      <mark className="rounded bg-primary/20 px-0.5 text-foreground">{texto.slice(i, i + t.length)}</mark>
      {texto.slice(i + t.length)}
    </>
  );
}

export function GlobalSearch() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [grupos, setGrupos] = useState<SearchGrupo[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  useEffect(() => setMounted(true), []);

  // Atajo ⌘K / Ctrl+K para abrir.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Bloquea scroll + foco al abrir.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(""); setGrupos([]); }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Búsqueda con debounce.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) { setGrupos([]); return; }
    const id = ++seq.current;
    const t = window.setTimeout(() => {
      startTransition(async () => {
        const res = await buscarGlobal(q);
        if (id === seq.current) setGrupos(res);
      });
    }, 250);
    return () => window.clearTimeout(t);
  }, [query, open]);

  const totalItems = grupos.reduce((s, g) => s + g.items.length, 0);

  const panel = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Búsqueda global"
            className="glass-strong relative z-10 w-full max-w-lg overflow-hidden rounded-2xl shadow-elev-3"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="flex items-center gap-2.5 border-b border-border/70 px-4">
              <Search className="h-5 w-5 shrink-0 text-primary" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca productos, clientes, ventas, proveedores…"
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground/60"
              />
              {isPending ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" /> : (
                <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
              {query.trim().length < 2 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">Escribe al menos 2 letras para buscar.</p>
              ) : totalItems === 0 && !isPending ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">Sin resultados para “{query.trim()}”.</p>
              ) : (
                grupos.map((g) => {
                  const Icon = ICONO[g.tipo];
                  return (
                    <div key={g.tipo} className="mb-1">
                      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</p>
                      {g.items.map((it) => (
                        <Link key={it.id} href={it.href} onClick={() => setOpen(false)}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-muted">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary"><Icon className="h-4 w-4" /></span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium"><Resaltar texto={it.titulo} q={query} /></p>
                            <p className="truncate text-xs text-muted-foreground"><Resaltar texto={it.sub} q={query} /></p>
                          </div>
                          <CornerDownLeft className="h-4 w-4 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60" />
                        </Link>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Disparador */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar"
        className="flex items-center gap-2 rounded-xl border border-border bg-card/50 px-2.5 py-2 text-sm text-muted-foreground shadow-elev-1 transition-colors hover:bg-muted sm:px-3"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Buscar…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground lg:inline-flex">⌘K</kbd>
      </button>
      {mounted ? createPortal(panel, document.body) : null}
    </>
  );
}
