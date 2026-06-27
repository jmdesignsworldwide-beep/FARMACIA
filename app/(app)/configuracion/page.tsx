import { Reveal } from "@/components/motion/reveal";
import { ConfiguracionView } from "@/components/config/configuracion-view";
import { requireCapability } from "@/lib/auth/guard";
import { getConfig } from "@/lib/data/config";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const emp = await requireCapability("ver_config");
  const config = await getConfig();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personaliza tu farmacia y cómo responde el sistema.</p>
      </Reveal>
      <ConfiguracionView config={config} username={emp.username} />
    </div>
  );
}
