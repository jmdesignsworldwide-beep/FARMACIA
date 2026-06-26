"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { usernameToEmail } from "@/lib/utils";

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

  const supabase = createClient();
  const email = usernameToEmail(username);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensaje genérico: no revelamos si el usuario existe o no.
    return { error: "Usuario o contraseña incorrectos." };
  }

  redirect("/dashboard");
}
