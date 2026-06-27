"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, Check, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { actualizarCredencialesAdmin, type FormState } from "@/app/(app)/demo/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-w-44">
      {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : <><ShieldCheck className="h-4 w-4" /> Actualizar credenciales</>}
    </Button>
  );
}

export function AdminCredencialesForm({ usuarioActual }: { usuarioActual: string }) {
  const [state, action] = useFormState(actualizarCredencialesAdmin, {} as FormState);
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Field label="Nuevo usuario (opcional)">
        <Input name="nuevo_usuario" placeholder={`Actual: ${usuarioActual}`} autoCapitalize="none" inputMode="text" />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nueva contraseña (opcional)">
          <div className="relative">
            <Input name="nueva_password" type={verNueva ? "text" : "password"} placeholder="Mínimo 6 caracteres" className="pr-10" />
            <button type="button" onClick={() => setVerNueva((v) => !v)} aria-label={verNueva ? "Ocultar" : "Mostrar"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {verNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirmar contraseña">
          <Input name="confirmar" type={verNueva ? "text" : "password"} placeholder="Repite la contraseña" />
        </Field>
      </div>

      <Field label="Tu contraseña actual" required hint="Necesaria para confirmar cualquier cambio.">
        <div className="relative">
          <Input name="actual" type={verActual ? "text" : "password"} placeholder="••••••••" required className="pr-10" />
          <button type="button" onClick={() => setVerActual((v) => !v)} aria-label={verActual ? "Ocultar" : "Mostrar"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {verActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      {state.error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{state.error}</motion.p>
      )}
      {state.ok && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success" role="status">
          <Check className="h-4 w-4" /> Credenciales actualizadas. Úsalas en tu próximo inicio de sesión.
        </motion.p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <KeyRound className="h-3 w-3" /> Cambia la credencial de desarrollo por una privada antes de entregar.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
