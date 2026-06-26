import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** Raíz: lleva al panel si hay sesión, si no al login. */
export default async function Home() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user ? "/dashboard" : "/login");
}
