"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, UserPlus, Check, Sparkles, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { crearCuentaDemo, type FormState } from "@/app/(app)/demo/actions";
import { VIGENCIAS } from "@/lib/data/demo-acceso-shared";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-44">
      {pending ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Creando…</>
      ) : (
        <><UserPlus className="h-4 w-4" /> Crear cuenta de cliente</>
      )}
    </Button>
  );
}

function generarPassword(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const b = "abcdefghijkmnpqrstuvwxyz";
  const n = "23456789";
  const pick = (s: string, k: number) => Array.from({ length: k }, (_, i) => s[(i * 7 + s.length) % s.length]).join("");
  // Combinación estable pero variada (sin Math.random, válido en SSR/cliente).
  const seed = Date.now().toString().slice(-4);
  return `JM${pick(a, 2)}${b[Number(seed[0]) % b.length]}${n.slice(0, 2)}${seed}`;
}

export function CrearCuentaForm() {
  const [state, action] = useFormState(crearCuentaDemo, {} as FormState);
  const [vigencia, setVigencia] = useState("7");
  const [pass, setPass] = useState("");
  const [verPass, setVerPass] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setVigencia("7");
      setPass("");
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Usuario del cliente" required>
          <Input name="username" placeholder="Ej. farmacia-cliente" inputMode="text" autoCapitalize="none" required />
        </Field>
        <Field label="Nombre / negocio (opcional)">
          <Input name="full_name" placeholder="Ej. Farmacia La Salud" />
        </Field>
        <Field label="Contraseña" required className="sm:col-span-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input name="password" type={verPass ? "text" : "password"} value={pass}
                onChange={(e) => setPass(e.target.value)} placeholder="Mínimo 6 caracteres" required className="pr-10" />
              <button type="button" onClick={() => setVerPass((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={verPass ? "Ocultar" : "Mostrar"}>
                {verPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="button" variant="outline" onClick={() => { setPass(generarPassword()); setVerPass(true); }}>
              <RefreshCw className="h-4 w-4" /> Generar
            </Button>
          </div>
        </Field>
      </div>

      {/* Vigencia */}
      <div>
        <p className="mb-2 text-sm font-medium">Vigencia del acceso</p>
        <input type="hidden" name="vigencia" value={vigencia} />
        <div className="flex flex-wrap gap-2">
          {VIGENCIAS.map((v) => (
            <button key={v.value} type="button" onClick={() => setVigencia(v.value)}
              className={cn("rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                vigencia === v.value
                  ? "border-primary bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-elev-1"
                  : "border-border/70 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-muted")}>
              {v.label}
            </button>
          ))}
        </div>
        {vigencia === "custom" && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 max-w-xs">
            <Field label="¿Cuántos días?" required>
              <Input name="dias_custom" type="number" min="1" max="3650" step="1" placeholder="Ej. 45" required />
            </Field>
          </motion.div>
        )}
        {vigencia === "none" && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Esta cuenta nunca expira (para un cliente ya cerrado).
          </p>
        )}
      </div>

      <Field label="Notas (opcional)">
        <Input name="notas" placeholder="Ej. Demo enviado por WhatsApp el 27/06" />
      </Field>

      {state.error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </motion.p>
      )}
      {state.ok && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success" role="status">
          <Check className="h-4 w-4" /> Cuenta creada. Aparece abajo con su fecha de vencimiento.
        </motion.p>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
