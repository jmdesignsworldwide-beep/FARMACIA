"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { usernameToEmail } from "@/lib/utils";
import { loginBloqueado, registrarFallo, limpiarThrottle } from "@/lib/auth/throttle";

export type LoginState = { error?: string };

/**
 * Inicia sesión con USUARIO + contraseña (el cliente nunca ve un email).
 * Validación 100% en el servidor: el usuario se mapea a un email interno
 * y se autentica contra Supabase.
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Escribe tu usuario y contraseña." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "El sistema aún no está conectado a la base de datos. Falta configurar Supabase.",
    };
  }

  // Throttle server-side por usuario (frena ráfagas de fuerza bruta).
  const llave = username.toLowerCase();
  const estado = loginBloqueado(llave);
  if (estado.bloqueado) {
    return { error: `Demasiados intentos. Espera ${estado.minutos} min e inténtalo de nuevo.` };
  }

  const supabase = createClient();
  const email = usernameToEmail(username);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    registrarFallo(llave);
    // Mensaje genérico: no revelamos si el usuario existe o no.
    return { error: "Usuario o contraseña incorrectos." };
  }

  limpiarThrottle(llave);
  // ?welcome=1 dispara la bienvenida cinematográfica una sola vez tras el login.
  redirect("/dashboard?welcome=1");
}
