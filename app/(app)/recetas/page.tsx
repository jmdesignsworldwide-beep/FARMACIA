import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { RecetasNav } from "@/components/recetas/recetas-nav";
import { RecetaLista } from "@/components/recetas/receta-lista";
import { requireCapability } from "@/lib/auth/guard";
import { getRecetas } from "@/lib/data/recetas";
import { can } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function RecetasPage({ searchParams }: { searchParams: { q?: string } }) {
  const emp = await requireCapability("ver_recetas");
  const q = searchParams.q?.trim();
  const recetas = await getRecetas(q);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Recetas</h1>
            <p className="mt-1 text-sm text-muted-foreground">Registro de recetas y despachos.</p>
          </div>
          {can(emp.rol, "gestionar_recetas") && (
            <Link href="/recetas/nueva"><Button size="sm"><Plus className="h-4 w-4" /> Nueva receta</Button></Link>
          )}
        </div>
      </Reveal>

      <RecetasNav />

      <form className="flex items-center gap-2.5 rounded-xl border border-input bg-card/50 px-3.5 py-2.5 shadow-elev-1 focus-within:border-ring">
        <Search className="h-[18px] w-[18px] text-muted-foreground" />
        <input name="q" defaultValue={q} placeholder="Buscar por paciente, médico o número…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
      </form>

      <RecetaLista recetas={recetas} />
    </div>
  );
}
