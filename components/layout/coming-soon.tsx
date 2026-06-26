import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { PulseDot } from "@/components/motion/pulse-dot";

/** Placeholder premium para módulos que llegan en próximas tandas. */
export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
      <Reveal className="w-full">
        <div className="glass rounded-3xl p-10 text-center shadow-elev-2">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elev-2">
            <Icon className="h-7 w-7" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-xs font-medium text-muted-foreground">
            <PulseDot tone="primary" />
            En construcción · próxima entrega
          </div>
        </div>
      </Reveal>
    </div>
  );
}
