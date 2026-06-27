import Link from "next/link";
import { Clock, MessageCircle, Instagram, Mail, LogOut, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(app)/actions";
import { JM_CONTACTO } from "@/lib/data/demo-acceso-shared";

export const dynamic = "force-dynamic";
export const metadata = { title: "Acceso expirado — JM Designs" };

const waLink = `https://wa.me/${JM_CONTACTO.telefonoDigits}?text=${encodeURIComponent(
  "Hola JM Designs, quiero renovar mi acceso al demo de JM Farmacia.",
)}`;

export default function ExpiradoPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      {/* Aura de marca */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      <Reveal>
        <div className="glass-strong w-full max-w-md rounded-3xl p-7 shadow-elev-3 sm:p-9">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
              <Clock className="h-8 w-8" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">Tu acceso ha expirado</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              El período de demostración de este sistema terminó. Para renovarlo y seguir explorando
              JM Farmacia, contacta a <strong className="text-foreground">JM Designs</strong>.
            </p>
          </div>

          {/* Contacto */}
          <div className="mt-6 space-y-2.5">
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 transition-colors hover:bg-success/15">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success"><MessageCircle className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">WhatsApp / Teléfono</p>
                <p className="text-xs text-muted-foreground">{JM_CONTACTO.telefono}</p>
              </div>
            </a>
            <a href={JM_CONTACTO.instagramUrl} target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 transition-colors hover:bg-accent/15">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent"><Instagram className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Instagram</p>
                <p className="text-xs text-muted-foreground">@{JM_CONTACTO.instagram}</p>
              </div>
            </a>
            <a href={`mailto:${JM_CONTACTO.correo}`}
              className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card/40 px-4 py-3 transition-colors hover:bg-muted">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary"><Mail className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Correo</p>
                <p className="truncate text-xs text-muted-foreground">{JM_CONTACTO.correo}</p>
              </div>
            </a>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Link href="/dashboard" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
              Ya renové · reintentar
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </Button>
            </form>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Demo desarrollado por JM Designs Worldwide
          </p>
        </div>
      </Reveal>
    </main>
  );
}
