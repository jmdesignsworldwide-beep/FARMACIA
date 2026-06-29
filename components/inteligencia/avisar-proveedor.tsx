"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Info, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { whatsappLink, telefonoWhatsapp } from "@/lib/utils";

type ProvNotif = { id: string; nombre: string; telefono: string | null };

function mensajeDefault(farmacia: string, producto: string, presentacion: string | null, cantidad: number) {
  return `Hola, le saluda ${farmacia}. Necesitamos reabastecer el siguiente producto: ${producto}${presentacion ? ` (${presentacion})` : ""} — cantidad sugerida: ${cantidad} unidades. ¿Disponibilidad y precio? Gracias.`;
}

/** Botón premium "Avisar al proveedor" → WhatsApp con número correcto y mensaje editable. */
export function AvisarProveedor({
  proveedores,
  farmacia,
  producto,
  presentacion,
  sugerencia,
  variant = "primary",
  label = "Avisar al proveedor",
}: {
  proveedores: ProvNotif[];
  farmacia: string;
  producto: string;
  presentacion: string | null;
  sugerencia: number;
  variant?: "primary" | "wa";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(proveedores[0]?.id ?? "");
  const [msg, setMsg] = useState(() => mensajeDefault(farmacia, producto, presentacion, sugerencia));

  const proveedor = proveedores.find((p) => p.id === sel) ?? proveedores[0];
  const link = useMemo(() => whatsappLink(proveedor?.telefono, msg), [proveedor, msg]);

  if (proveedores.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-elev-2 transition-all hover:shadow-glow active:scale-[0.98]"
      >
        <MessageCircle className="h-4 w-4" /> {label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} className="max-w-md">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#25D366]/15 text-[#25D366]"><MessageCircle className="h-6 w-6" /></span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Avisar al proveedor</h2>
            <p className="text-sm text-muted-foreground">Se abrirá WhatsApp con el mensaje listo para enviar.</p>
          </div>
        </div>

        {proveedores.length > 1 && (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Proveedor</span>
            <Select value={sel} onChange={(e) => setSel(e.target.value)}>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </label>
        )}

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Mensaje (editable)</span>
            <span className="text-xs text-muted-foreground">{proveedor?.nombre} · {proveedor?.telefono ?? "—"}</span>
          </div>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5}
            className="w-full resize-none rounded-xl border border-input bg-card/50 px-3.5 py-2.5 text-sm outline-none focus:border-ring" />
        </div>

        {!telefonoWhatsapp(proveedor?.telefono) && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-warning"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Este proveedor no tiene un teléfono válido registrado.</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-elev-2 transition-all hover:shadow-glow active:scale-[0.98]">
              <ExternalLink className="h-4 w-4" /> Abrir WhatsApp
            </a>
          ) : (
            <Button disabled>Abrir WhatsApp</Button>
          )}
        </div>
      </Modal>
    </>
  );
}
