"use client";

import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Check, Truck, PackageCheck, X, Loader2 } from "lucide-react";
import { cambiarEstadoDelivery, type FormState } from "@/app/(app)/deliveries/actions";
import { cn } from "@/lib/utils";

const PASOS = [
  { key: "pendiente", label: "Pendiente", icon: Check },
  { key: "en_camino", label: "En camino", icon: Truck },
  { key: "entregado", label: "Entregado", icon: PackageCheck },
];

function Btn({ estado, children, danger }: { estado: string; children: React.ReactNode; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name="estado" value={estado} disabled={pending}
      className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-elev-1 transition-all active:scale-[0.98] disabled:opacity-60",
        danger ? "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15" : "bg-primary text-primary-foreground hover:shadow-glow")}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

export function DeliveryEstado({ deliveryId, estado, puedeEditar }: { deliveryId: string; estado: string; puedeEditar: boolean }) {
  const [state, action] = useFormState(cambiarEstadoDelivery, {} as FormState);
  const idx = PASOS.findIndex((p) => p.key === estado);
  const cancelado = estado === "cancelado";

  return (
    <div className="glass rounded-2xl p-5 shadow-elev-1">
      <h2 className="mb-4 text-sm font-semibold tracking-tight">Estado del delivery</h2>

      {/* Stepper */}
      <div className="flex items-center">
        {PASOS.map((p, i) => {
          const done = !cancelado && i <= idx;
          const Icon = p.icon;
          return (
            <div key={p.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span className={cn("grid h-9 w-9 place-items-center rounded-full transition-colors", done ? "bg-gradient-to-br from-primary to-accent text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className={cn("text-[11px]", done ? "font-medium" : "text-muted-foreground")}>{p.label}</span>
              </div>
              {i < PASOS.length - 1 && <div className={cn("mx-1 h-0.5 flex-1 rounded", !cancelado && i < idx ? "bg-primary" : "bg-border")} />}
            </div>
          );
        })}
      </div>

      {cancelado && <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-center text-sm font-medium text-danger">Delivery cancelado</p>}

      {puedeEditar && !cancelado && estado !== "entregado" && (
        <form action={action} className="mt-5 flex flex-wrap gap-2">
          <input type="hidden" name="delivery_id" value={deliveryId} />
          {estado === "pendiente" && <Btn estado="en_camino"><Truck className="h-4 w-4" /> Marcar en camino</Btn>}
          {estado === "en_camino" && <Btn estado="entregado"><PackageCheck className="h-4 w-4" /> Confirmar entrega</Btn>}
          <Btn estado="cancelado" danger><X className="h-4 w-4" /> Cancelar</Btn>
        </form>
      )}

      {state.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
    </div>
  );
}
