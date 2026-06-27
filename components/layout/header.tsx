import { Brand } from "./brand";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { RolBadge } from "@/components/empleados/rol-badge";

/** Header superior: hamburguesa (móvil), marca, toggle de tema y usuario. */
export function Header({
  username,
  nombre,
  rol,
  farmacia,
  adminDemo,
}: {
  username: string;
  nombre: string;
  rol: string;
  farmacia?: string;
  adminDemo?: boolean;
}) {
  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/70 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav rol={rol} nombre={farmacia} adminDemo={adminDemo} />
        <div className="lg:hidden">
          <Brand name={farmacia} />
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <p className="text-sm text-muted-foreground">Hola, {nombre} 👋</p>
          <RolBadge rol={rol} />
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <UserMenu username={username} />
      </div>
    </header>
  );
}
