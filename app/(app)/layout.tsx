import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { WelcomeGate } from "@/components/welcome/welcome-gate";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentEmpleado } from "@/lib/data/empleados";
import { getMiAccesoDemo } from "@/lib/data/demo-acceso";
import { getConfig } from "@/lib/data/config";

/** Shell protegido: sidebar + header. Verifica auth, vigencia y rol en el servidor. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let username = "Invitada";
  let nombre = "Invitada";
  let rol = "dueno"; // sin Supabase configurado, no bloquear el preview
  let farmacia = "JM Farmacia";
  let adminDemo = false;

  if (isSupabaseConfigured()) {
    const [emp, config, miAcceso] = await Promise.all([
      getCurrentEmpleado(),
      getConfig(),
      getMiAccesoDemo(),
    ]);
    if (!emp) redirect("/login");
    // ⚠️ Capa B: si la cuenta tiene acceso de demo y NO está vigente → bloquear.
    if (miAcceso && !miAcceso.vigente) redirect("/expirado");
    username = emp.username;
    nombre = emp.full_name?.split(" ")[0] ?? emp.username;
    rol = emp.rol;
    farmacia = config.nombre_farmacia;
    adminDemo = Boolean(miAcceso?.esAdminDemo);
  }

  return (
    <div className="flex min-h-dvh">
      <WelcomeGate nombre={nombre} farmacia={farmacia} />
      <Sidebar rol={rol} nombre={farmacia} adminDemo={adminDemo} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header username={username} nombre={nombre} rol={rol} farmacia={farmacia} adminDemo={adminDemo} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
