import Link from "next/link";
import { Search, Plus, ShieldAlert } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { EmpleadoLista } from "@/components/empleados/empleado-lista";
import { requireCapability } from "@/lib/auth/guard";
import { getEmpleados } from "@/lib/data/empleados";
import { isAdminConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function EmpleadosPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireCapability("ver_empleados");
  const q = searchParams.q?.trim();
  const empleados = await getEmpleados(q);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Empleados</h1>
            <p className="mt-1 text-sm text-muted-foreground">Equipo de la farmacia, sus roles y accesos.</p>
          </div>
          <Link href="/empleados/nuevo"><Button size="sm"><Plus className="h-4 w-4" /> Nuevo empleado</Button></Link>
        </div>
      </Reveal>

      {!isAdminConfigured() && (
        <Reveal>
          <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Falta configurar <strong>SUPABASE_SERVICE_ROLE_KEY</strong> en Vercel para gestionar empleados con su propio acceso.</p>
          </div>
        </Reveal>
      )}

      <form className="flex items-center gap-2.5 rounded-xl border border-input bg-card/50 px-3.5 py-2.5 shadow-elev-1 focus-within:border-ring">
        <Search className="h-[18px] w-[18px] text-muted-foreground" />
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, usuario o cédula…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
      </form>

      <EmpleadoLista empleados={empleados} />
    </div>
  );
}
