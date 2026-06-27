"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, ScanLine, Plus, Minus, Trash2, ShoppingCart, Banknote,
  CreditCard, ArrowLeftRight, Loader2, Info, LockKeyhole, X,
} from "lucide-react";
import { Magnetic } from "@/components/motion/magnetic";
import { CountUp } from "@/components/motion/count-up";
import { PulseDot } from "@/components/motion/pulse-dot";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { ControladoBadge, RecetaBadge } from "@/components/inventario/badges";
import { ScanButton } from "@/components/scanner/scan-button";
import { ControladoModal, type RecetaDatos } from "./controlado-modal";
import { RecetaModal } from "./receta-modal";
import { Receipt, type ReciboData } from "./receipt";
import { registrarVenta } from "@/app/(app)/ventas/actions";
import { METODOS_PAGO } from "@/lib/data/ventas-shared";
import { formatRD, cn } from "@/lib/utils";
import type { ProductoVendible, LoteVendible } from "@/lib/data/ventas-shared";
import type { ClienteBasico } from "@/lib/data/clientes-shared";

type CartLine = { producto: ProductoVendible; cantidad: number };

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
}: {
  productos: ProductoVendible[];
  clientes: ClienteBasico[];
  cajaAbierta: boolean;
}) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
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
  const [isPending, startTransition] = useTransition();

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productos.slice(0, 12);
    return productos
      .filter(
        (p) =>
          p.nombre_comercial.toLowerCase().includes(q) ||
          p.nombre_generico.toLowerCase().includes(q) ||
          (p.codigo_barras ?? "").includes(q),
      )
      .slice(0, 24);
  }, [productos, query]);

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;
  const subtotal = cart.reduce((s, l) => s + l.producto.precio_venta * l.cantidad, 0);
  const total = Math.max(subtotal - descuento, 0);
  const cambio = metodo === "efectivo" ? Math.max(recibido - total, 0) : 0;

  function enCarrito(id: string) {
    return cart.find((l) => l.producto.id === id)?.cantidad ?? 0;
  }

  function agregar(p: ProductoVendible) {
    setError(null);
    if (enCarrito(p.id) >= p.stock_total) return;
    setCart((prev) => {
      const ex = prev.find((l) => l.producto.id === p.id);
      if (ex) return prev.map((l) => (l.producto.id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l));
      return [...prev, { producto: p, cantidad: 1 }];
    });
  }

  function intentarAgregar(p: ProductoVendible) {
    if (p.controlado) return setPendiente(p);
    if (p.requiere_receta) return setPendienteReceta(p);
    agregar(p);
  }

  function setCantidad(id: string, cantidad: number) {
    const prod = cart.find((l) => l.producto.id === id)?.producto;
    if (!prod) return;
    const c = Math.max(1, Math.min(cantidad, prod.stock_total));
    setCart((prev) => prev.map((l) => (l.producto.id === id ? { ...l, cantidad: c } : l)));
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
          precio_unitario: l.producto.precio_venta,
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
      setRecibo({
        folio: res.folio!,
        total: res.total!,
        cambio: res.cambio!,
        metodo,
        items: res.items ?? [],
      });
      limpiar();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      {/* Buscador + productos */}
      <div className="space-y-4 lg:col-span-3">
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-input bg-card/50 px-3.5 py-3 shadow-elev-1 focus-within:border-ring focus-within:shadow-glow">
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {resultados.map((p) => {
            const agotado = enCarrito(p.id) >= p.stock_total;
            return (
              <Magnetic key={p.id} strength={0.12}>
                <button
                  onClick={() => intentarAgregar(p)}
                  disabled={agotado}
                  className={cn(
                    "group flex h-full w-full flex-col rounded-2xl glass p-3.5 text-left shadow-elev-1 transition-shadow hover:shadow-elev-2 disabled:opacity-50",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-semibold leading-tight tracking-tight">{p.nombre_comercial}</span>
                    {p.controlado ? <LockKeyhole className="h-4 w-4 shrink-0 text-danger" /> : null}
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    {p.nombre_generico}{p.concentracion ? ` · ${p.concentracion}` : ""}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.controlado && <ControladoBadge />}
                    {p.requiere_receta && !p.controlado && <RecetaBadge />}
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <span className="tabular text-sm font-semibold text-primary">{formatRD(p.precio_venta)}</span>
                    <span className="tabular text-[11px] text-muted-foreground">{p.stock_total} uds</span>
                  </div>
                </button>
              </Magnetic>
            );
          })}
          {resultados.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-border bg-card/30 p-6 text-center text-sm text-muted-foreground">
              Sin productos. Prueba otro término o registra mercancía en Inventario.
            </p>
          )}
        </div>
      </div>

      {/* Carrito */}
      <div className="lg:col-span-2">
        <div className="glass sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col rounded-2xl p-4 shadow-elev-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <ShoppingCart className="h-4 w-4" /> Venta actual
            </h2>
            {cart.length > 0 && (
              <button onClick={limpiar} className="text-xs text-muted-foreground hover:text-danger">Vaciar</button>
            )}
          </div>

          {!cajaAbierta && (
            <Link href="/ventas/caja" className="mt-3 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs font-medium text-warning">
              <Info className="h-4 w-4 shrink-0" /> No hay caja abierta — ábrela para cobrar.
            </Link>
          )}

          {/* Cliente (opcional) */}
          <div className="mt-3">
            <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="h-10 py-2 text-sm">
              <option value="">Cliente: sin asociar</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}{c.cedula ? ` · ${c.cedula}` : ""}</option>
              ))}
            </Select>
            {cliente && cliente.alergias.length > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
                <PulseDot tone="danger" />
                <span>Alergias: {cliente.alergias.join(", ")}</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
            <AnimatePresence initial={false}>
              {cart.map((l) => {
                const used = fefoPreview(l.producto.lotes, l.cantidad);
                return (
                  <motion.div
                    key={l.producto.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-border/60 bg-card/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{l.producto.nombre_comercial}</p>
                        <p className="tabular text-xs text-muted-foreground">{formatRD(l.producto.precio_venta)} c/u</p>
                      </div>
                      <button onClick={() => quitar(l.producto.id)} aria-label="Quitar" className="text-muted-foreground hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Stepper onClick={() => setCantidad(l.producto.id, l.cantidad - 1)}><Minus className="h-3.5 w-3.5" /></Stepper>
                        <span className="tabular w-7 text-center text-sm font-semibold">{l.cantidad}</span>
                        <Stepper onClick={() => setCantidad(l.producto.id, l.cantidad + 1)} disabled={l.cantidad >= l.producto.stock_total}><Plus className="h-3.5 w-3.5" /></Stepper>
                      </div>
                      <span className="tabular text-sm font-semibold">{formatRD(l.producto.precio_venta * l.cantidad)}</span>
                    </div>
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
            {cart.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Agrega productos para iniciar la venta.</p>
            )}
          </div>

          {/* Totales y pago */}
          {cart.length > 0 && (
            <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Descuento</label>
                <Input type="number" min="0" step="0.01" value={descuento || ""} onChange={(e) => setDescuento(Math.max(0, Number(e.target.value) || 0))} className="h-9 w-28 py-1.5" placeholder="RD$ 0.00" />
              </div>

              <div className="flex items-end justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="tabular text-2xl font-semibold tracking-tight">
                  <CountUp value={total} currency />
                </span>
              </div>

              {/* Métodos de pago */}
              <div className="grid grid-cols-2 gap-2">
                {METODOS_PAGO.map((m) => {
                  const Icon = metodoIcon[m.value];
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMetodo(m.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors",
                        metodo === m.value ? "border-primary/50 bg-primary/12 text-primary" : "border-border bg-card/40 text-muted-foreground hover:text-foreground",
                      )}
                    >
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
      </div>

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
