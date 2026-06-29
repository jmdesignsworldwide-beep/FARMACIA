"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Search, ScanLine, Plus, Minus, Trash2, ShoppingCart, Banknote,
  CreditCard, ArrowLeftRight, Loader2, Info, LockKeyhole, X, Check, ChevronUp, ChevronDown, Star, Contact, Truck,
} from "lucide-react";
import { Magnetic } from "@/components/motion/magnetic";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { CountUp } from "@/components/motion/count-up";
import { PulseDot } from "@/components/motion/pulse-dot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { FitText } from "@/components/ui/fit-text";
import { Autocomplete } from "@/components/ui/autocomplete";
import { crearClienteRapido } from "@/app/(app)/clientes/actions";
import { ControladoBadge, RecetaBadge } from "@/components/inventario/badges";
import { ScanButton } from "@/components/scanner/scan-button";
import { ControladoModal, type RecetaDatos } from "./controlado-modal";
import { RecetaModal } from "./receta-modal";
import { Receipt, type ReciboData } from "./receipt";
import { registrarVenta } from "@/app/(app)/ventas/actions";
import { METODOS_PAGO } from "@/lib/data/ventas-shared";
import { precioModo, unidadesPorModo, modoPorDefecto, presentacionEtiqueta, type ModoVenta } from "@/lib/data/presentacion-shared";
import { formatRD, cn } from "@/lib/utils";
import type { ProductoVendible, LoteVendible } from "@/lib/data/ventas-shared";
import type { ClienteBasico } from "@/lib/data/clientes-shared";

type CartLine = { producto: ProductoVendible; modo: ModoVenta; cantidad: number };

const fmtVenc = (d: string) =>
  new Date(d).toLocaleDateString("es-DO", { month: "short", year: "numeric" });

/** Calcula de qué lotes saldría una cantidad (FEFO). */
function fefoPreview(lotes: LoteVendible[], cantidad: number) {
  let rem = cantidad;
  const used: { lote: LoteVendible; take: number }[] = [];
  for (const lote of lotes) {
    if (rem <= 0) break;
    const take = Math.min(lote.cantidad, rem);
    used.push({ lote, take });
    rem -= take;
  }
  return used;
}

const metodoIcon: Record<string, typeof Banknote> = {
  efectivo: Banknote,
  transferencia: ArrowLeftRight,
  tarjeta_debito: CreditCard,
  tarjeta_credito: CreditCard,
};

export function POS({
  productos,
  clientes,
  cajaAbierta,
  farmacia,
  empleado,
  proveedores,
  proveedorPorProducto,
  masVendidos,
}: {
  productos: ProductoVendible[];
  clientes: ClienteBasico[];
  cajaAbierta: boolean;
  farmacia: string;
  empleado: string;
  proveedores: { id: string; nombre: string }[];
  proveedorPorProducto: Record<string, string[]>;
  masVendidos: ProductoVendible[];
}) {
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("");
  const [proveedorSel, setProveedorSel] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientesAll, setClientesAll] = useState(clientes);
  const [clienteId, setClienteId] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [metodo, setMetodo] = useState<string>("efectivo");
  const [recibido, setRecibido] = useState<number>(0);
  const [voucher, setVoucher] = useState("");
  const [receta, setReceta] = useState<RecetaDatos | null>(null);
  const [pendiente, setPendiente] = useState<ProductoVendible | null>(null);
  const [pendienteReceta, setPendienteReceta] = useState<ProductoVendible | null>(null);
  const [recibo, setRecibo] = useState<ReciboData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<{ id: string; n: number } | null>(null);
  const [mobileCart, setMobileCart] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [masOpen, setMasOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setMounted(true), []);

  // Recuerda si "Más vendidos" quedó abierto/cerrado durante la sesión.
  useEffect(() => {
    const saved = window.sessionStorage.getItem("pos-mas-vendidos-open");
    if (saved !== null) setMasOpen(saved === "1");
  }, []);
  useEffect(() => {
    window.sessionStorage.setItem("pos-mas-vendidos-open", masOpen ? "1" : "0");
  }, [masOpen]);

  // Limpia el destello "agregado" tras la micro-interacción.
  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(null), 650);
    return () => window.clearTimeout(t);
  }, [added]);

  const categorias = useMemo(
    () => [...new Set(productos.map((p) => p.categoria))].sort(),
    [productos],
  );

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = productos;
    if (categoria) list = list.filter((p) => p.categoria === categoria);
    if (proveedorSel) list = list.filter((p) => (proveedorPorProducto[p.id] ?? []).includes(proveedorSel));
    if (q) list = list.filter(
      (p) =>
        p.nombre_comercial.toLowerCase().includes(q) ||
        p.nombre_generico.toLowerCase().includes(q) ||
        (p.codigo_barras ?? "").includes(q),
    );
    return list.slice(0, q || categoria || proveedorSel ? 30 : 18);
  }, [productos, query, categoria, proveedorSel, proveedorPorProducto]);

  const sinFiltro = !query.trim() && !categoria && !proveedorSel;

  const cliente = clientesAll.find((c) => c.id === clienteId) ?? null;
  const subtotal = cart.reduce((s, l) => s + precioModo(l.producto, l.modo) * l.cantidad, 0);
  const total = Math.max(subtotal - descuento, 0);
  const cambio = metodo === "efectivo" ? Math.max(recibido - total, 0) : 0;
  const itemCount = cart.reduce((s, l) => s + l.cantidad, 0);

  function maxPiezas(p: ProductoVendible, modo: ModoVenta) {
    return Math.floor(p.stock_total / unidadesPorModo(p, modo));
  }

  function estaAgotado(p: ProductoVendible) {
    const linea = cart.find((l) => l.producto.id === p.id);
    if (linea) return linea.cantidad >= maxPiezas(p, linea.modo);
    const minConsume = p.vende_unidad ? 1 : Math.max(1, p.unidades_por_caja);
    return p.stock_total < minConsume;
  }

  function agregar(p: ProductoVendible) {
    setError(null);
    setAdded((a) => ({ id: p.id, n: (a?.n ?? 0) + 1 }));
    setCart((prev) => {
      const ex = prev.find((l) => l.producto.id === p.id);
      if (ex) {
        if (ex.cantidad >= maxPiezas(p, ex.modo)) return prev;
        return prev.map((l) => (l.producto.id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l));
      }
      return [...prev, { producto: p, modo: modoPorDefecto(p), cantidad: 1 }];
    });
  }

  function intentarAgregar(p: ProductoVendible) {
    if (p.controlado) return setPendiente(p);
    if (p.requiere_receta) return setPendienteReceta(p);
    agregar(p);
  }

  function setCantidad(id: string, cantidad: number) {
    setCart((prev) => prev.map((l) => {
      if (l.producto.id !== id) return l;
      const c = Math.max(1, Math.min(cantidad, Math.max(1, maxPiezas(l.producto, l.modo))));
      return { ...l, cantidad: c };
    }));
  }

  function cambiarModo(id: string, modo: ModoVenta) {
    setError(null);
    setCart((prev) => prev.map((l) => {
      if (l.producto.id !== id) return l;
      const c = Math.max(1, Math.min(l.cantidad, Math.max(1, maxPiezas(l.producto, modo))));
      return { ...l, modo, cantidad: c };
    }));
  }

  function quitar(id: string) {
    setCart((prev) => prev.filter((l) => l.producto.id !== id));
  }

  function limpiar() {
    setCart([]);
    setDescuento(0);
    setRecibido(0);
    setVoucher("");
    setReceta(null);
    setClienteId("");
  }

  const puedeCobrar =
    cajaAbierta &&
    cart.length > 0 &&
    !isPending &&
    (metodo !== "efectivo" || recibido >= total) &&
    (metodo !== "transferencia" || voucher.trim().length > 0);

  function cobrar() {
    if (!puedeCobrar) return;
    setError(null);
    startTransition(async () => {
      const res = await registrarVenta({
        items: cart.map((l) => ({
          producto_id: l.producto.id,
          cantidad: l.cantidad,
          precio_unitario: precioModo(l.producto, l.modo),
          unidades: l.cantidad * unidadesPorModo(l.producto, l.modo),
          presentacion: presentacionEtiqueta(l.modo, l.producto.unidades_por_caja),
        })),
        metodo,
        descuento,
        montoRecibido: metodo === "efectivo" ? recibido : null,
        voucher: metodo === "transferencia" ? voucher.trim() : null,
        receta: receta ?? null,
        clienteId: clienteId || null,
        clienteNombre: cliente?.nombre ?? null,
      });
      if (!res.ok) {
        setError(res.error ?? "No se pudo completar la venta.");
        return;
      }
      setMobileCart(false);
      setRecibo({
        folio: res.folio!,
        fecha: new Date().toISOString(),
        farmacia,
        empleado,
        metodo,
        subtotal,
        descuento,
        total: res.total!,
        cambio: res.cambio!,
        clienteNombre: cliente?.nombre ?? null,
        items: res.items ?? [],
      });
      limpiar();
    });
  }

  // ── Panel "Venta actual" (reutilizado en columna fija y bottom sheet) ──
  const cartPanel = (
    <div className="glass-strong flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 p-4 shadow-elev-3">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elev-1">
            <ShoppingCart className="h-4 w-4" />
          </span>
          Venta actual
          {itemCount > 0 && (
            <span className="tabular rounded-full bg-primary/12 px-2 py-0.5 text-xs font-semibold text-primary">{itemCount}</span>
          )}
        </h2>
        {cart.length > 0 && (
          <button onClick={limpiar} className="text-xs font-medium text-muted-foreground hover:text-danger">Vaciar</button>
        )}
      </div>

      {!cajaAbierta && (
        <Link href="/ventas/caja" className="mt-3 flex shrink-0 items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs font-medium text-warning">
          <Info className="h-4 w-4 shrink-0" /> No hay caja abierta — ábrela para cobrar.
        </Link>
      )}

      <div className="mt-3 shrink-0">
        <Autocomplete
          kind="select"
          icon={Contact}
          placeholder="Cliente: escribe para buscar o crear…"
          options={clientesAll.map((c) => ({ value: c.id, label: c.nombre, sub: c.cedula ?? undefined }))}
          onChange={(value) => setClienteId(value)}
          onCreate={async (texto) => {
            const r = await crearClienteRapido(texto);
            if (!r.ok || !r.id) return null;
            setClientesAll((prev) => [...prev, { id: r.id!, nombre: r.nombre!, cedula: null, alergias: [] }]);
            setClienteId(r.id);
            return { value: r.id, label: r.nombre! };
          }}
        />
        {cliente && cliente.alergias.length > 0 && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
            <PulseDot tone="danger" />
            <span>Alergias: {cliente.alergias.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Lista con scroll interno (o estado vacío que llena) */}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <div className="grid h-full place-items-center px-4 py-10 text-center">
            <div>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary/70">
                <ShoppingCart className="h-8 w-8" />
              </span>
              <p className="mt-3 text-sm font-medium">Carrito vacío</p>
              <p className="mt-1 text-xs text-muted-foreground">Toca un producto para iniciar la venta.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {cart.map((l) => {
                const ambas = l.producto.vende_caja && l.producto.vende_unidad;
                const precio = precioModo(l.producto, l.modo);
                const unidades = l.cantidad * unidadesPorModo(l.producto, l.modo);
                const used = fefoPreview(l.producto.lotes, unidades);
                return (
                  <motion.div
                    key={l.producto.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-border/60 bg-card/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{l.producto.nombre_comercial}</p>
                        <p className="tabular text-xs text-muted-foreground">
                          {formatRD(precio)} / {l.modo === "caja" ? "caja" : "unidad"}
                        </p>
                      </div>
                      <button onClick={() => quitar(l.producto.id)} aria-label="Quitar" className="text-muted-foreground transition-colors hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {ambas ? (
                      <div className="mt-2 inline-flex rounded-lg border border-border/70 bg-card/40 p-0.5 text-xs">
                        {(["unidad", "caja"] as ModoVenta[]).map((m) => (
                          <button key={m} onClick={() => cambiarModo(l.producto.id, m)}
                            className={cn("rounded-md px-2.5 py-1 font-medium transition-colors",
                              l.modo === m ? "bg-gradient-to-r from-primary to-accent text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                            {m === "caja" ? "Caja" : "Detallado"}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="mt-2 inline-block rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {l.modo === "caja" ? "Por caja" : "Detallado"}
                      </span>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <CantidadEditor
                        cantidad={l.cantidad}
                        stock={maxPiezas(l.producto, l.modo)}
                        onChange={(n) => setCantidad(l.producto.id, n)}
                      />
                      <span className="tabular text-sm font-semibold">{formatRD(precio * l.cantidad)}</span>
                    </div>

                    {l.modo === "caja" && (
                      <p className="mt-1 text-[11px] text-muted-foreground">= {unidades} unidades de stock</p>
                    )}
                    {used[0] && (
                      <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                        ↳ Sale del lote <span className="font-medium">{used[0].lote.numero_lote}</span> · vence {fmtVenc(used[0].lote.fecha_vencimiento)}
                        {used.length > 1 ? ` +${used.length - 1} lote` : ""}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pie fijo, siempre visible */}
      {cart.length > 0 && (
        <div className="mt-3 shrink-0 space-y-3 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Descuento</label>
            <Input type="number" min="0" step="0.01" value={descuento || ""} onChange={(e) => setDescuento(Math.max(0, Number(e.target.value) || 0))} className="h-9 w-28 py-1.5" placeholder="RD$ 0.00" />
          </div>

          <div className="flex items-end justify-between gap-3">
            <span className="shrink-0 text-sm text-muted-foreground">Total</span>
            <FitText className="flex-1 text-right" textClassName="tabular text-3xl font-bold tracking-tight">
              <CountUp value={total} currency />
            </FitText>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {METODOS_PAGO.map((m) => {
              const Icon = metodoIcon[m.value];
              return (
                <button key={m.value} onClick={() => setMetodo(m.value)}
                  className={cn("flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors",
                    metodo === m.value ? "border-primary/50 bg-primary/12 text-primary shadow-elev-1" : "border-border bg-card/40 text-muted-foreground hover:text-foreground")}>
                  <Icon className="h-4 w-4" /> {m.label}
                </button>
              );
            })}
          </div>

          {metodo === "efectivo" && (
            <div className="space-y-2 rounded-xl border border-border/60 bg-card/40 p-3">
              <label className="text-xs text-muted-foreground">Monto recibido</label>
              <Input type="number" min="0" step="0.01" value={recibido || ""} onChange={(e) => setRecibido(Number(e.target.value) || 0)} placeholder="RD$ 0.00" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cambio</span>
                <span className="tabular font-semibold text-success"><CountUp value={cambio} currency /></span>
              </div>
            </div>
          )}

          {metodo === "transferencia" && (
            <div className="space-y-2 rounded-xl border border-border/60 bg-card/40 p-3">
              <label className="text-xs text-muted-foreground">Número de voucher</label>
              <Input value={voucher} onChange={(e) => setVoucher(e.target.value)} placeholder="Ej. TRX-998877" />
              <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" /> La verificación de voucher duplicado es simulada (demostración).</p>
            </div>
          )}

          {receta && (
            <p className="rounded-lg bg-danger/10 px-2.5 py-1.5 text-[11px] text-danger">
              Receta registrada: {receta.paciente} · {receta.numero}
            </p>
          )}

          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

          <Button onClick={cobrar} size="lg" className="w-full" disabled={!puedeCobrar}>
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Cobrando…</> : <>Cobrar {formatRD(total)}</>}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="lg:flex lg:items-start lg:gap-5">
      {/* Izquierda: buscador + chips + grilla */}
      <div className="min-w-0 flex-1 space-y-4 pb-24 lg:pb-0">
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-input bg-card/50 px-4 py-3.5 shadow-elev-1 transition-shadow focus-within:border-ring focus-within:shadow-glow">
            <ScanLine className="h-5 w-5 text-primary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escanea o busca por nombre, genérico o código…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              autoFocus
            />
            {query ? (
              <button onClick={() => setQuery("")} aria-label="Limpiar"><X className="h-4 w-4 text-muted-foreground" /></button>
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <ScanButton onDetected={(c) => setQuery(c)} label="" />
        </div>

        {/* Chips de categoría + filtro por proveedor (misma fila, alineados) */}
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={categoria === ""} onClick={() => setCategoria("")}>Todos</Chip>
          {categorias.map((c) => (
            <Chip key={c} active={categoria === c} onClick={() => setCategoria(categoria === c ? "" : c)}>{c}</Chip>
          ))}
          {proveedores.length > 0 && (
            <>
              <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-border/60 sm:block" aria-hidden />
              <div className={cn("relative inline-flex items-center rounded-full border text-xs font-medium transition-colors focus-within:border-ring",
                proveedorSel ? "border-primary bg-primary/12 text-primary" : "border-border/70 bg-card/40 text-muted-foreground")}>
                <Truck className="pointer-events-none absolute left-2.5 h-3.5 w-3.5" />
                <select value={proveedorSel} onChange={(e) => setProveedorSel(e.target.value)}
                  aria-label="Filtrar por proveedor"
                  className="appearance-none rounded-full bg-transparent py-1.5 pl-7 pr-7 font-medium outline-none">
                  <option value="">Todos los proveedores</option>
                  {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5" />
              </div>
            </>
          )}
        </div>

        {/* Más vendidos (desplegable: todos visibles, sin scroll horizontal) */}
        {sinFiltro && masVendidos.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/30">
            <button
              type="button"
              onClick={() => setMasOpen((v) => !v)}
              aria-expanded={masOpen}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted/40"
            >
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-warning" /> Más vendidos
                <span className="tabular rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning">{masVendidos.length}</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", masOpen && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
              {masOpen && (
                <motion.div
                  key="mas-vendidos"
                  initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 px-3 pb-3 pt-0.5">
                    {masVendidos.map((p) => {
                      const agotado = estaAgotado(p);
                      return (
                        <button key={p.id} onClick={() => intentarAgregar(p)} disabled={agotado}
                          className={cn("group flex items-center gap-2 rounded-full border border-border/70 bg-card/50 py-1.5 pl-2 pr-3 text-sm shadow-elev-1 transition-all hover:-translate-y-0.5 hover:shadow-elev-2 disabled:opacity-50",
                            added?.id === p.id && !reduce && "ring-2 ring-primary")}>
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-warning/15 text-warning"><Star className="h-3 w-3" /></span>
                          <span className="whitespace-nowrap font-medium">{p.nombre_comercial}</span>
                          <span className="tabular whitespace-nowrap text-xs font-semibold text-primary">{formatRD(p.precio_venta)}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Grilla de productos */}
        {resultados.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-muted-foreground">
            Sin productos. Prueba otro término o registra mercancía en Inventario.
          </p>
        ) : (
          <Stagger key={categoria} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {resultados.map((p) => {
              const agotado = estaAgotado(p);
              const bajo = p.stock_total > 0 && p.stock_total <= Math.max(p.stock_minimo, 5);
              return (
                <StaggerItem key={p.id} className="h-full">
                  <Magnetic strength={0.12} className="h-full">
                    <button
                      onClick={() => intentarAgregar(p)}
                      disabled={agotado}
                      className={cn(
                        "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl glass p-3.5 text-left shadow-elev-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow disabled:opacity-50",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        p.controlado && "border-danger/30",
                        added?.id === p.id && !reduce && "ring-2 ring-primary",
                      )}
                    >
                      {/* Destello al agregar */}
                      <AnimatePresence>
                        {added?.id === p.id && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-elev-2"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>

                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold leading-tight tracking-tight">{p.nombre_comercial}</span>
                        {p.controlado ? <LockKeyhole className="h-4 w-4 shrink-0 text-danger" /> : null}
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {p.nombre_generico}{p.concentracion ? ` · ${p.concentracion}` : ""}
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.controlado && <ControladoBadge />}
                        {p.requiere_receta && !p.controlado && <RecetaBadge />}
                        {p.vende_caja && p.vende_unidad && (
                          <span className="rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">Caja / Unidad</span>
                        )}
                      </div>
                      <div className="mt-auto flex items-end justify-between gap-1 pt-2.5">
                        <span className="tabular text-base font-bold tracking-tight text-primary">{formatRD(p.precio_venta)}</span>
                        <span className={cn("tabular rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                          agotado ? "bg-danger/10 text-danger" : bajo ? "bg-warning/15 text-warning" : "text-muted-foreground")}>
                          {agotado ? "Agotado" : `${p.stock_total} uds`}
                        </span>
                      </div>
                    </button>
                  </Magnetic>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>

      {/* Derecha: columna fija (desktop), más ancha */}
      <div className="hidden lg:block lg:w-[25rem] lg:shrink-0 xl:w-[28rem]">
        <div className="sticky top-20 h-[calc(100dvh-7rem)]">{cartPanel}</div>
      </div>

      {/* Barra inferior (móvil) */}
      {cart.length > 0 && (
        <button onClick={() => setMobileCart(true)}
          className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border/70 bg-card/95 px-4 py-3 shadow-elev-3 backdrop-blur lg:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/12 text-primary"><ShoppingCart className="h-4 w-4" /></span>
            {itemCount} {itemCount === 1 ? "ítem" : "ítems"}
          </span>
          <span className="flex items-center gap-3">
            <span className="tabular text-lg font-bold"><CountUp value={total} currency /></span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-sm font-semibold text-primary-foreground">
              Ver carrito <ChevronUp className="h-4 w-4" />
            </span>
          </span>
        </button>
      )}

      {/* Bottom sheet (móvil) */}
      {mounted && createPortal(
        <AnimatePresence>
          {mobileCart && (
            <div className="fixed inset-0 z-[70] lg:hidden">
              <motion.div className="absolute inset-0 bg-background/70 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileCart(false)} />
              <motion.div
                className="absolute inset-x-0 bottom-0 h-[88dvh]"
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
              >
                <button onClick={() => setMobileCart(false)} aria-label="Cerrar"
                  className="absolute -top-10 right-4 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-foreground shadow-elev-2"><X className="h-5 w-5" /></button>
                {cartPanel}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* Modales */}
      <ControladoModal
        open={Boolean(pendiente)}
        productoNombre={pendiente?.nombre_comercial}
        onConfirm={(r) => { setReceta(r); if (pendiente) agregar(pendiente); setPendiente(null); }}
        onCancel={() => setPendiente(null)}
      />
      <RecetaModal
        open={Boolean(pendienteReceta)}
        productoNombre={pendienteReceta?.nombre_comercial}
        onConfirm={() => { if (pendienteReceta) agregar(pendienteReceta); setPendienteReceta(null); }}
        onCancel={() => setPendienteReceta(null)}
      />
      <Receipt data={recibo} onClose={() => setRecibo(null)} />
    </div>
  );
}

/** Chip de filtro de categoría. */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-primary bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-elev-1" : "border-border/70 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-muted")}>
      {children}
    </button>
  );
}

/** Cantidad editable: − [campo tecleable] +, sincronizados y validados contra el stock. */
function CantidadEditor({ cantidad, stock, onChange }: { cantidad: number; stock: number; onChange: (n: number) => void }) {
  const [text, setText] = useState(String(cantidad));
  const [aviso, setAviso] = useState(false);

  useEffect(() => setText(String(cantidad)), [cantidad]);

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(false), 2500);
    return () => window.clearTimeout(t);
  }, [aviso]);

  function escribir(raw: string) {
    const limpio = raw.replace(/[^0-9]/g, "");
    setText(limpio);
    if (limpio === "") return;
    const n = parseInt(limpio, 10);
    if (n > stock) {
      setAviso(true);
      onChange(stock);
    } else {
      onChange(Math.max(1, n));
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Stepper onClick={() => onChange(cantidad - 1)} disabled={cantidad <= 1}><Minus className="h-3.5 w-3.5" /></Stepper>
        <input
          value={text}
          inputMode="numeric"
          aria-label="Cantidad"
          onChange={(e) => escribir(e.target.value)}
          onBlur={() => { if (text === "" || parseInt(text, 10) < 1) { setText("1"); onChange(1); } }}
          onFocus={(e) => e.currentTarget.select()}
          className="tabular h-7 w-11 rounded-lg border border-border bg-card/50 text-center text-sm font-semibold outline-none transition-colors focus:border-ring focus:shadow-glow"
        />
        <Stepper onClick={() => onChange(cantidad + 1)} disabled={cantidad >= stock}><Plus className="h-3.5 w-3.5" /></Stepper>
      </div>
      {aviso && <p className="mt-1 text-[10px] font-medium text-warning">Solo quedan {stock} {stock === 1 ? "unidad" : "unidades"}.</p>}
    </div>
  );
}

function Stepper({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-card/50 text-foreground transition-colors hover:bg-muted disabled:opacity-40"
    >
      {children}
    </button>
  );
}
