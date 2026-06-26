import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** Shell protegido: sidebar + header. Verifica auth en el servidor. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let username = "Invitada";

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    // El usuario visible es la parte antes del @ del email interno.
    username = user.email?.split("@")[0] ?? "Usuaria";
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header username={username} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
