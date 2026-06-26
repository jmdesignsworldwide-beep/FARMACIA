import { cn } from "@/lib/utils";

/** Tarjeta base: glass sutil, sombra en capas, esquina redondeada de marca. */
export function Card({
  className,
  glow = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 shadow-elev-2 transition-shadow duration-300",
        glow && "shadow-glow",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-sm font-medium tracking-tight text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CardValue({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "tabular mt-1 text-3xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  );
}
