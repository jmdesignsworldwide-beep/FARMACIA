import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentEmpleado } from "@/lib/data/empleados";
import { getConfig } from "@/lib/data/config";

/** Shell protegido: sidebar + header. Verifica auth y rol en el servidor. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let username = "Invitada";
  let nombre = "Invitada";
  let rol = "dueno"; // sin Supabase configurado, no bloquear el preview
  let farmacia = "JM Farmacia";

  if (isSupabaseConfigured()) {
    const [emp, config] = await Promise.all([getCurrentEmpleado(), getConfig()]);
    if (!emp) redirect("/login");
    username = emp.username;
    nombre = emp.full_name?.split(" ")[0] ?? emp.username;
    rol = emp.rol;
    farmacia = config.nombre_farmacia;
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar rol={rol} nombre={farmacia} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header username={username} nombre={nombre} rol={rol} farmacia={farmacia} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
