"use client";

import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Opt = { value: string; label: ReactNode; text: string; disabled?: boolean };

/** Texto plano de un nodo (para el control cerrado, búsqueda por teclado y aria). */
function flatten(node: ReactNode): string {
  if (node == null || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flatten).join("");
  if (isValidElement(node)) return flatten((node.props as { children?: ReactNode }).children);
  return "";
}

/** Convierte los <option>/<optgroup> hijos en una lista de opciones. */
function parseOptions(children: ReactNode): Opt[] {
  const out: Opt[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === "optgroup") {
      out.push(...parseOptions((child.props as { children?: ReactNode }).children));
      return;
    }
    if (child.type !== "option") return;
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    const label = props.children;
    const text = flatten(label);
    const value = props.value !== undefined ? String(props.value) : text;
    out.push({ value, label, text, disabled: props.disabled });
  });
  return out;
}

/**
 * Dropdown premium reutilizable — reemplaza al <select> nativo en TODO el sistema.
 * API compatible con un <select> (hijos <option>, value/defaultValue, onChange, name,
 * required, disabled, className) para ser drop-in. La lista abierta usa el tema de la
 * marca (glass, acento verde/turquesa) en ambos temas, con navegación por teclado.
 */
export const Select = forwardRef<HTMLButtonElement, SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }>(
  function Select(
    { value, defaultValue, onChange, name, required, disabled, className, children, placeholder, id, ...rest },
    ref,
  ) {
    const reduce = useReducedMotion();
    const autoId = useId();
    const listId = `sel-${autoId}`;
    const options = useMemo(() => parseOptions(children), [children]);

    const controlled = value !== undefined;
    const [inner, setInner] = useState<string>(() => {
      if (defaultValue !== undefined) return String(defaultValue);
      const first = options.find((o) => !o.disabled);
      return first?.value ?? "";
    });
    const current = controlled ? String(value) : inner;

    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const wrapRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selected = options.find((o) => o.value === current) ?? null;

    // Cierra al hacer clic fuera.
    useEffect(() => {
      if (!open) return;
      function onDoc(e: MouseEvent) {
        if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
      }
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    // Al abrir, posiciona el activo en la opción seleccionada y la trae a la vista.
    useEffect(() => {
      if (!open) return;
      const idx = options.findIndex((o) => o.value === current);
      setActive(idx >= 0 ? idx : 0);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
      if (!open || !listRef.current) return;
      const node = listRef.current.children[active] as HTMLElement | undefined;
      node?.scrollIntoView({ block: "nearest" });
    }, [active, open]);

    function emit(v: string) {
      if (!controlled) setInner(v);
      onChange?.({ target: { value: v, name }, currentTarget: { value: v, name } } as never);
    }

    function choose(opt: Opt) {
      if (opt.disabled) return;
      emit(opt.value);
      setOpen(false);
      btnRef.current?.focus();
    }

    function move(dir: 1 | -1) {
      setActive((i) => {
        let n = i;
        for (let step = 0; step < options.length; step++) {
          n = (n + dir + options.length) % options.length;
          if (!options[n]?.disabled) break;
        }
        return n;
      });
    }

    function onKeyDown(e: React.KeyboardEvent) {
      if (disabled) return;
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); move(1); break;
        case "ArrowUp": e.preventDefault(); move(-1); break;
        case "Home": e.preventDefault(); setActive(options.findIndex((o) => !o.disabled)); break;
        case "End": e.preventDefault(); setActive(options.length - 1); break;
        case "Enter":
        case " ": e.preventDefault(); if (options[active]) choose(options[active]); break;
        case "Escape": e.preventDefault(); setOpen(false); btnRef.current?.focus(); break;
        case "Tab": setOpen(false); break;
      }
    }

    return (
      <div ref={wrapRef} className="relative">
        {name && <input type="hidden" name={name} value={current} required={required} />}
        <button
          type="button"
          id={id}
          ref={(node) => {
            btnRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          }}
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          onKeyDown={onKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={(rest as { "aria-label"?: string })["aria-label"]}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-xl border border-input bg-card/50 px-3.5 py-2.5 text-left text-sm outline-none transition-colors",
            "focus-visible:border-ring focus-visible:shadow-glow disabled:cursor-not-allowed disabled:opacity-60",
            open && "border-ring shadow-glow",
            className,
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground/60")}>
            {selected ? selected.label : placeholder ?? "Selecciona…"}
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              ref={listRef}
              id={listId}
              role="listbox"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="menu-scroll glass-strong absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-auto rounded-xl border border-border/70 p-1 shadow-elev-3"
            >
              {options.map((o, i) => {
                const sel = o.value === current;
                return (
                  <li key={`${o.value}-${i}`} role="option" aria-selected={sel}>
                    <button
                      type="button"
                      disabled={o.disabled}
                      onMouseEnter={() => !o.disabled && setActive(i)}
                      onClick={() => choose(o)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        o.disabled && "cursor-not-allowed opacity-40",
                        sel
                          ? "bg-primary/12 font-medium text-primary"
                          : active === i
                            ? "bg-primary/10 text-foreground"
                            : "text-foreground/90 hover:bg-primary/10",
                      )}
                    >
                      <span className="truncate">{o.label}</span>
                      {sel && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
