import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground/80">{hint}</span>}
    </label>
  );
}

const baseField =
  "w-full rounded-xl border border-input bg-card/50 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:shadow-glow disabled:opacity-60";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(baseField, className)} {...props} />
));
Input.displayName = "Input";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(baseField, "appearance-none pr-9", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";

/** Interruptor estilo toggle para flags booleanos (controlado / receta). */
export function Toggle({
  name,
  defaultChecked,
  label,
  description,
  tone = "primary",
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  description?: string;
  tone?: "primary" | "danger" | "accent";
}) {
  const toneRing =
    tone === "danger"
      ? "peer-checked:bg-danger"
      : tone === "accent"
        ? "peer-checked:bg-accent"
        : "peer-checked:bg-primary";
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/40 px-3.5 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && (
          <span className="block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span
          className={cn(
            "h-6 w-11 rounded-full bg-muted transition-colors",
            toneRing,
          )}
        />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-elev-1 transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
