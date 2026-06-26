import { Crown, ShieldCheck, Pill, Banknote, Bike, type LucideIcon } from "lucide-react";
import { rolLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const META: Record<string, { icon: LucideIcon; cls: string }> = {
  dueno: { icon: Crown, cls: "border-primary/40 bg-primary/12 text-primary" },
  admin: { icon: ShieldCheck, cls: "border-accent/40 bg-accent/12 text-accent" },
  farmaceutico: { icon: Pill, cls: "border-success/40 bg-success/12 text-success" },
  cajero: { icon: Banknote, cls: "border-border bg-muted text-muted-foreground" },
  motorista: { icon: Bike, cls: "border-warning/40 bg-warning/12 text-warning" },
};

export function RolBadge({ rol, className }: { rol: string; className?: string }) {
  const m = META[rol] ?? META.cajero;
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", m.cls, className)}>
      <Icon className="h-3 w-3" />
      {rolLabel(rol)}
    </span>
  );
}
