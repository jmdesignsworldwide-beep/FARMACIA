import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

/** Sidebar de escritorio (fijo). En móvil se reemplaza por el drawer. */
export function Sidebar({ rol }: { rol: string }) {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border/70">
      <div className="glass flex h-full flex-col gap-6 px-4 py-6">
        <div className="px-2">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks rol={rol} />
        </div>
        <div className="rounded-xl border border-border/70 bg-card/40 px-3 py-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo de ventas</p>
          <p className="mt-0.5">Versión de muestra · JM Farmacia</p>
        </div>
      </div>
    </aside>
  );
}
