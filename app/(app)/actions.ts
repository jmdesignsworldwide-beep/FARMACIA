"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** Cierra la sesión en el servidor y vuelve al login. */
export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
