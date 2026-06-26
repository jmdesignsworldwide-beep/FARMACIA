import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Reveal } from "@/components/motion/reveal";
import { LoginForm } from "./login-form";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Entrar — JM Farmacia",
};

export default async function LoginPage() {
  // Si ya hay sesión, no mostrar el login.
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <Reveal className="w-full max-w-md">
        <div className="glass-strong rounded-3xl p-7 shadow-elev-3 sm:p-9">
          <div className="mb-7 flex flex-col items-center text-center">
            <Brand />
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">
              Bienvenida
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Entra con tu usuario para gestionar la farmacia.
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Conexión segura · acceso privado
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Demo premium · JM Farmacia
        </p>
      </Reveal>
    </main>
  );
}
