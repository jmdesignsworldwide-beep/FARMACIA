"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, Plus, Loader2, Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AutoOption = { value: string; label: string; sub?: string };

/**
 * Autocompletado inteligente reusable (UNO para todo el sistema).
 * - `kind="text"`: el valor enviado ES el texto escrito (campos libres con sugerencia).
 * - `kind="select"`: hay que elegir una opción (o crearla); el valor enviado es su `value` (id).
 * Teclado (↑↓ + Enter), tap, resaltado del término, "+ Crear" al vuelo, AnimatePresence.
 */
export function Autocomplete({
  name,
  kind = "text",
  options,
  defaultValue = "",
  defaultLabel = "",
  placeholder,
  icon: Icon = Search,
  required,
  onCreate,
  onChange,
  emptyText = "Sin coincidencias",
}: {
  name?: string;
  kind?: "text" | "select";
  options: AutoOption[];
  defaultValue?: string;
  defaultLabel?: string;
  placeholder?: string;
  icon?: LucideIcon;
  required?: boolean;
  /** Habilita "+ Crear": recibe el texto, crea de verdad y devuelve la opción nueva (o null). */
  onCreate?: (texto: string) => Promise<AutoOption | null>;
  /** Notifica al padre el valor + etiqueta elegidos. */
  onChange?: (value: string, label: string) => void;
  emptyText?: string;
}) {
  const reduce = useReducedMotion();
  const [text, setText] = useState(defaultLabel || (kind === "text" ? defaultValue : ""));
  const [val, setVal] = useState(defaultValue);
  const [extra, setExtra] = useState<AutoOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const all = useMemo(() => [...options, ...extra], [options, extra]);
  const q = text.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? all.filter((o) => o.label.toLowerCase().includes(q) || (o.sub ?? "").toLowerCase().includes(q)) : all).slice(0, 8),
    [all, q],
  );
  const exact = all.find((o) => o.label.toLowerCase() === q);
  const canCreate = Boolean(onCreate) && q.length >= 1 && !exact;
  const filas = filtered.length + (canCreate ? 1 : 0);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function emit(value: string, label: string) {
    setVal(value);
    onChange?.(value, label);
  }

  function escribir(v: string) {
    setText(v);
    setOpen(true);
    setActive(-1);
    if (kind === "text") emit(v, v);
    else emit("", ""); // al escribir, se invalida la selección hasta elegir
  }

  function elegir(o: AutoOption) {
    setText(o.label);
    emit(kind === "text" ? o.label : o.value, o.label);
    setOpen(false);
  }

  async function crear() {
    if (!onCreate) return;
    setBusy(true);
    const nuevo = await onCreate(text.trim());
    setBusy(false);
    if (nuevo) {
      setExtra((e) => [...e, nuevo]);
      setText(nuevo.label);
      emit(kind === "text" ? nuevo.label : nuevo.value, nuevo.label);
    }
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, filas - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      if (active >= 0 && active < filtered.length) elegir(filtered[active]);
      else if (canCreate) crear();
    } else if (e.key === "Escape") setOpen(false);
  }

  const seleccionado = kind === "select" && Boolean(val);

  return (
    <div ref={boxRef} className="relative">
      <div className={cn("flex items-center gap-2.5 rounded-xl border border-input bg-card/50 px-3.5 py-2.5 transition-colors focus-within:border-ring focus-within:shadow-glow",
        seleccionado && "border-primary/40")}>
        {seleccionado ? <Check className="h-[18px] w-[18px] shrink-0 text-primary" /> : <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />}
        <input
          value={text}
          onChange={(e) => escribir(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
        {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
      </div>

      {/* Campo enviado: en select, el id va en un hidden; en text, el propio texto. */}
      {kind === "select" && name && <input type="hidden" name={name} value={val} />}
      {kind === "text" && name && <input type="hidden" name={name} value={text} />}

      <AnimatePresence>
        {open && (filas > 0 || (q.length >= 1 && !canCreate)) && (
          <motion.ul
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="glass-strong absolute z-30 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-border/70 p-1 shadow-elev-3"
          >
            {filtered.map((o, i) => (
              <li key={o.value}>
                <button type="button" onMouseEnter={() => setActive(i)} onClick={() => elegir(o)}
                  className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    active === i ? "bg-primary/12 text-primary" : "hover:bg-muted")}>
                  <span className="min-w-0 flex-1 truncate">
                    <Resaltar texto={o.label} q={q} />
                    {o.sub && <span className="ml-1.5 text-xs text-muted-foreground">{o.sub}</span>}
                  </span>
                </button>
              </li>
            ))}
            {canCreate && (
              <li>
                <button type="button" onMouseEnter={() => setActive(filtered.length)} onClick={crear} disabled={busy}
                  className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    active === filtered.length ? "bg-primary/15 text-primary" : "text-primary hover:bg-primary/10")}>
                  <Plus className="h-4 w-4 shrink-0" /> Crear “{text.trim()}” como nuevo
                </button>
              </li>
            )}
            {filtered.length === 0 && !canCreate && q.length >= 1 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Resaltar({ texto, q }: { texto: string; q: string }) {
  if (!q) return <>{texto}</>;
  const i = texto.toLowerCase().indexOf(q);
  if (i < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i)}
      <mark className="rounded bg-primary/20 px-0.5 text-foreground">{texto.slice(i, i + q.length)}</mark>
      {texto.slice(i + q.length)}
    </>
  );
}
