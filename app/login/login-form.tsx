"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initial: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Entrando…
        </>
      ) : (
        "Entrar"
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(login, initial);
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        icon={<User className="h-[18px] w-[18px]" />}
        label="Usuario"
      >
        <input
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="tu usuario"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
      </Field>

      <Field icon={<Lock className="h-[18px] w-[18px]" />} label="Contraseña">
        <input
          name="password"
          type={showPw ? "text" : "password"}
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {showPw ? (
            <EyeOff className="h-[18px] w-[18px]" />
          ) : (
            <Eye className="h-[18px] w-[18px]" />
          )}
        </button>
      </Field>

      {state.error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {state.error}
        </motion.p>
      )}

      <SubmitButton />
    </form>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "flex items-center gap-2.5 rounded-xl border border-input bg-card/50 px-3.5 py-3",
          "transition-colors focus-within:border-ring focus-within:shadow-glow",
        )}
      >
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </span>
    </label>
  );
}
