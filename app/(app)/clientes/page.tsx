import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { ClienteLista } from "@/components/clientes/cliente-lista";
import { requireCapability } from "@/lib/auth/guard";
import { getClientes } from "@/lib/data/clientes";
import { can } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function ClientesPage({ searchParams }: { searchParams: { q?: string } }) {
  const emp = await requireCapability("ver_clientes");
  const q = searchParams.q?.trim();
  const clientes = await getClientes(q);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Clientes</h1>
            <p className="mt-1 text-sm text-muted-foreground">Registro de clientes y su historial.</p>
          </div>
          {can(emp.rol, "gestionar_clientes") && (
            <Link href="/clientes/nuevo"><Button size="sm"><Plus className="h-4 w-4" /> Nuevo cliente</Button></Link>
          )}
        </div>
      </Reveal>

      <form className="flex items-center gap-2.5 rounded-xl border border-input bg-card/50 px-3.5 py-2.5 shadow-elev-1 focus-within:border-ring">
        <Search className="h-[18px] w-[18px] text-muted-foreground" />
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, cédula o teléfono…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
      </form>

      <ClienteLista clientes={clientes} />
    </div>
  );
}
