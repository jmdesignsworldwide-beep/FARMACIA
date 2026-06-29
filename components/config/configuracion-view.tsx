"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Store, Bell, Users, History, KeyRound, CreditCard, FileText, Printer,
  CloudUpload, MonitorSmartphone, ChevronRight, Check, Loader2, Info,
  ImagePlus, ShieldCheck, LogOut, Save,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Field, Input, Select, Toggle } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(app)/actions";
import {
  guardarDatosFarmacia, guardarAlertas, guardarMetodos, cambiarPassword, type FormState,
} from "@/app/(app)/configuracion/actions";
import type { Config } from "@/lib/data/config-shared";
import { cn } from "@/lib/utils";

function SaveBtn({ label = "Guardar" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {label}
    </Button>
  );
}

function Ok({ show, label = "Guardado" }: { show?: boolean; label?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          className="inline-flex items-center gap-1 text-sm font-medium text-success">
          <Check className="h-4 w-4" /> {label}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function Section({ icon: Icon, title, desc, children }: { icon: typeof Store; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="glass rounded-2xl p-5 shadow-elev-1">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><Icon className="h-5 w-5" /></span>
          <div><h2 className="text-base font-semibold tracking-tight">{title}</h2>{desc && <p className="text-xs text-muted-foreground">{desc}</p>}</div>
        </div>
        {children}
      </section>
    </Reveal>
  );
}

function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /><p>{children}</p>
    </div>
  );
}

export function ConfiguracionView({ config, username }: { config: Config; username: string }) {
  return (
    <div className="space-y-5">
      <DatosFarmacia config={config} />
      <Alertas config={config} />
      <UsuariosRoles username={username} />
      <Metodos config={config} />
      <Navegable />
    </div>
  );
}

function DatosFarmacia({ config }: { config: Config }) {
  const [state, action] = useFormState(guardarDatosFarmacia, {} as FormState);
  const [logo, setLogo] = useState(Boolean(config.logo_url));
  return (
    <Section icon={Store} title="Datos de la farmacia" desc="El nombre se refleja en todo el sistema.">
      <form action={action} className="space-y-4">
        <input type="hidden" name="logo_url" value={logo ? "demo://logo" : ""} />
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary"><ImagePlus className="h-7 w-7" /></span>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => setLogo((v) => !v)}>{logo ? "Logo adjunto" : "Subir logo"}</Button>
            <p className="mt-1 text-[11px] text-muted-foreground">Vista de demostración del logo.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre de la farmacia" required className="sm:col-span-2"><Input name="nombre_farmacia" defaultValue={config.nombre_farmacia} required /></Field>
          <Field label="RNC"><Input name="rnc" defaultValue={config.rnc ?? ""} placeholder="1-01-23456-7" /></Field>
          <Field label="Teléfono"><Input name="telefono" defaultValue={config.telefono ?? ""} placeholder="809-555-1234" /></Field>
          <Field label="Dirección" className="sm:col-span-2"><Input name="direccion" defaultValue={config.direccion ?? ""} placeholder="Calle, sector, ciudad" /></Field>
        </div>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <div className="flex items-center justify-end gap-3"><Ok show={state.ok} /><SaveBtn /></div>
      </form>
    </Section>
  );
}

function Alertas({ config }: { config: Config }) {
  const [state, action] = useFormState(guardarAlertas, {} as FormState);
  return (
    <Section icon={Bell} title="Alertas" desc="El sistema entero obedece estos umbrales.">
      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Stock mínimo por defecto" hint="Bajo este nivel, un producto se marca en bajo stock.">
            <Input name="stock_minimo_default" type="number" min="0" defaultValue={config.stock_minimo_default} />
          </Field>
          <Field label="Días para alerta de vencimiento" hint="Los lotes que vencen dentro de estos días se marcan por vencer.">
            <Input name="dias_alerta_vencimiento" type="number" min="1" max="365" defaultValue={config.dias_alerta_vencimiento} />
          </Field>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /><p>Al guardar, el panel e inventario actualizan sus alertas de "bajo stock" y "por vencer" al instante.</p>
        </div>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <div className="flex items-center justify-end gap-3"><Ok show={state.ok} /><SaveBtn /></div>
      </form>
    </Section>
  );
}

function UsuariosRoles({ username }: { username: string }) {
  const [state, action] = useFormState(cambiarPassword, {} as FormState);
  return (
    <Section icon={Users} title="Usuarios y roles" desc="Gestión de empleados, roles e historial.">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link href="/empleados" className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3.5 py-3 transition-colors hover:bg-muted">
          <Users className="h-4 w-4 text-primary" /><span className="flex-1 text-sm font-medium">Gestionar empleados y roles</span><ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link href="/actividad" className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3.5 py-3 transition-colors hover:bg-muted">
          <History className="h-4 w-4 text-primary" /><span className="flex-1 text-sm font-medium">Historial de actividad</span><ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <form action={action} className="mt-5 space-y-3 border-t border-border/60 pt-4">
        <p className="flex items-center gap-2 text-sm font-medium"><KeyRound className="h-4 w-4" /> Cambiar mi contraseña <span className="text-xs font-normal text-muted-foreground">({username})</span></p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nueva contraseña"><Input name="password" type="password" placeholder="••••••••" /></Field>
          <Field label="Confirmar"><Input name="confirmar" type="password" placeholder="••••••••" /></Field>
        </div>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <div className="flex items-center justify-end gap-3"><Ok show={state.ok} /><SaveBtn label="Actualizar contraseña" /></div>
      </form>
    </Section>
  );
}

function Metodos({ config }: { config: Config }) {
  const [state, action] = useFormState(guardarMetodos, {} as FormState);
  const m = config.metodos_pago;
  return (
    <Section icon={CreditCard} title="Métodos de pago" desc="Activa los que acepta tu farmacia.">
      <form action={action} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle name="efectivo" label="Efectivo" defaultChecked={m.efectivo} />
          <Toggle name="transferencia" label="Transferencia" defaultChecked={m.transferencia} />
          <Toggle name="tarjeta_debito" label="Tarjeta débito" defaultChecked={m.tarjeta_debito} />
          <Toggle name="tarjeta_credito" label="Tarjeta crédito" defaultChecked={m.tarjeta_credito} />
        </div>
        <div className="flex items-center justify-end gap-3"><Ok show={state.ok} /><SaveBtn /></div>
      </form>
    </Section>
  );
}

/** Botón de guardado para las secciones NAVEGABLES (responde con feedback claro). */
function GuardarDemo({ label = "Guardar" }: { label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="mt-3 flex items-center justify-end gap-3">
      <Ok show={ok} />
      <Button type="button" variant="outline" size="sm" onClick={() => { setOk(true); window.setTimeout(() => setOk(false), 2500); }}>
        <Save className="h-4 w-4" /> {label}
      </Button>
    </div>
  );
}

function Navegable() {
  const [respaldo, setRespaldo] = useState(false);
  const [sesiones, setSesiones] = useState([
    { id: "tablet", nombre: "Tablet del mostrador", detalle: "Santiago · hace 2 h" },
    { id: "movil", nombre: "Celular (Android)", detalle: "Santo Domingo · ayer" },
  ]);
  const [cerrada, setCerrada] = useState(false);

  return (
    <>
      <Section icon={FileText} title="Facturación NCF" desc="Comprobantes fiscales (DGII).">
        <Disclaimer>NCF simulado para demostración. No certificado ante la DGII.</Disclaimer>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Secuencia B01 (crédito fiscal)"><Input defaultValue="B0100000001 – B0100001000" /></Field>
          <Field label="Secuencia B02 (consumo)"><Input defaultValue="B0200000001 – B0200005000" /></Field>
        </div>
        <GuardarDemo label="Guardar secuencias" />
      </Section>

      <Section icon={ShieldCheck} title="Facturación Electrónica (e-CF)" desc="Comprobante fiscal electrónico.">
        <Disclaimer>Facturación electrónica de demostración. No certificada ante la DGII.</Disclaimer>
        <div className="mt-3"><Toggle name="ecf" label="Emitir e-CF en cada venta" description="Demostración" /></div>
        <GuardarDemo />
      </Section>

      <Section icon={Printer} title="Impresora de recibos" desc="Configuración de impresión.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Impresora">
            <Select>
              <option>EPSON TM-T20 (térmica 80mm)</option><option>Star TSP143</option><option>Genérica 58mm</option>
            </Select>
          </Field>
          <Field label="Ancho de papel">
            <Select>
              <option>80 mm</option><option>58 mm</option>
            </Select>
          </Field>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Configuración de demostración.</p>
        <GuardarDemo label="Guardar impresora" />
      </Section>

      <Section icon={CloudUpload} title="Respaldo en la nube" desc="Copia de seguridad de tus datos.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Último respaldo: hoy, 6:00 a. m.</p>
            <p className="text-xs text-muted-foreground">Respaldos automáticos diarios (demostración).</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setRespaldo(true)}>
            {respaldo ? <><Check className="h-4 w-4" /> Respaldo iniciado</> : <><CloudUpload className="h-4 w-4" /> Respaldar ahora</>}
          </Button>
        </div>
      </Section>

      <Section icon={MonitorSmartphone} title="Sesiones activas" desc="Dispositivos con sesión abierta.">
        <ul className="space-y-2">
          <li className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">Este dispositivo</p><p className="text-xs text-muted-foreground">Navegador · activo ahora</p></div>
            <span className="text-[11px] font-medium text-success">Actual</span>
          </li>
          {sesiones.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{s.nombre}</p><p className="text-xs text-muted-foreground">{s.detalle}</p></div>
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:bg-danger/10 hover:text-danger"
                onClick={() => { setSesiones((prev) => prev.filter((x) => x.id !== s.id)); setCerrada(true); window.setTimeout(() => setCerrada(false), 2500); }}>
                <LogOut className="h-4 w-4" /> Cerrar
              </Button>
            </li>
          ))}
        </ul>
        {sesiones.length === 0 && <p className="mt-2 text-xs text-muted-foreground">No hay otros dispositivos con sesión abierta.</p>}
        <div className="mt-3 flex items-center justify-between gap-3">
          <Ok show={cerrada} label="Sesión cerrada" />
          <form action={signOut} className="ml-auto">
            <Button type="submit" variant="outline" size="sm" className="text-danger"><LogOut className="h-4 w-4" /> Cerrar mi sesión</Button>
          </form>
        </div>
      </Section>
    </>
  );
}
