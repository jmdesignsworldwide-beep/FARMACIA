import { redirect } from "next/navigation";
import { ShieldCheck, Users, Sparkles, Info } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { CrearCuentaForm } from "@/components/demo/crear-cuenta-form";
import { CuentasLista } from "@/components/demo/cuentas-lista";
import { isAdminDemo, getDemoAccesos } from "@/lib/data/demo-acceso";

export const dynamic = "force-dynamic";
export const metadata = { title: "Acceso de demo — JM Designs" };

export default async function DemoAdminPage() {
  // ⚠️ Guard de Capa B en el SERVIDOR: una cuenta de cliente no puede entrar aquí.
  if (!(await isAdminDemo())) redirect("/dashboard");
  const cuentas = await getDemoAccesos();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Reveal>
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elev-1">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Acceso de demo</h1>
            <p className="text-sm text-muted-foreground">Tu capa de control (JM Designs): crea cuentas de cliente con vigencia.</p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-2.5 text-xs text-accent">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Esta capa es independiente de los roles internos de la farmacia (dueño, cajero…). Aquí controlas <strong>quién puede entrar al demo y por cuánto tiempo</strong>. Al vencerse, el cliente ve una pantalla para contactarte.</p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight">
            <Sparkles className="h-4 w-4 text-primary" /> Crear cuenta de cliente
          </h2>
          <CrearCuentaForm />
        </Card>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold tracking-tight">Mis cuentas ({cuentas.length})</h2>
        </div>
        <CuentasLista cuentas={cuentas} />
      </Reveal>
    </div>
  );
}
