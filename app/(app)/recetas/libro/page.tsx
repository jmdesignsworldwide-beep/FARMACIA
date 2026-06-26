import { BookLock, Search } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { RecetasNav } from "@/components/recetas/recetas-nav";
import { LibroLista } from "@/components/recetas/libro-lista";
import { DisclaimerControlados } from "@/components/recetas/disclaimer";
import { SelloInviolable } from "@/components/empleados/sello-inviolable";
import { requireCapability } from "@/lib/auth/guard";
import { getLibro } from "@/lib/data/recetas";

export const dynamic = "force-dynamic";

export default async function LibroPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireCapability("ver_controlados");
  const entries = await getLibro({ q: searchParams.q?.trim() });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          <BookLock className="h-6 w-6" /> Libro de controlados
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Asiento permanente de cada despacho de medicamento controlado.</p>
      </Reveal>

      <RecetasNav />
      <Reveal><SelloInviolable className="w-full sm:w-auto" /></Reveal>
      <Reveal><DisclaimerControlados /></Reveal>

      <form className="flex items-center gap-2.5 rounded-xl border border-input bg-card/50 px-3.5 py-2.5 shadow-elev-1 focus-within:border-ring">
        <Search className="h-[18px] w-[18px] text-muted-foreground" />
        <input name="q" defaultValue={searchParams.q} placeholder="Buscar por paciente, producto o número de receta…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
      </form>

      <LibroLista entries={entries} />
    </div>
  );
}
