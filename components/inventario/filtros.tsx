"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { CATEGORIAS } from "@/lib/data/categorias";
import { cn } from "@/lib/utils";

const CHIPS = [
  { key: "bajo", label: "Bajo stock" },
  { key: "controlado", label: "Controlado" },
  { key: "receta", label: "Receta" },
] as const;

export function Filtros({ proveedores = [] }: { proveedores?: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  // Empuja la búsqueda a la URL con debounce (el servidor re-consulta).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => {
      update("q", q || null);
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  function toggleChip(key: string) {
    update(key, params.get(key) ? null : "1");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-input bg-card/50 px-3.5 py-2.5 focus-within:border-ring focus-within:shadow-glow">
          {isPending ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-[18px] w-[18px] text-muted-foreground" />
          )}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, genérico o código de barras…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            inputMode="search"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Limpiar" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={params.get("categoria") ?? ""}
          onChange={(e) => update("categoria", e.target.value || null)}
          className="rounded-xl border border-input bg-card/50 px-3.5 py-2.5 text-sm outline-none focus:border-ring sm:w-52"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {proveedores.length > 0 && (
          <select
            value={params.get("proveedor") ?? ""}
            onChange={(e) => update("proveedor", e.target.value || null)}
            className="rounded-xl border border-input bg-card/50 px-3.5 py-2.5 text-sm outline-none focus:border-ring sm:w-52"
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => {
          const active = Boolean(params.get(chip.key));
          return (
            <button
              key={chip.key}
              onClick={() => toggleChip(chip.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary/40 bg-primary/12 text-primary"
                  : "border-border bg-card/40 text-muted-foreground hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
