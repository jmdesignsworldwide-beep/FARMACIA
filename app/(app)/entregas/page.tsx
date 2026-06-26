import { Bike } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
import { requireCapability } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function EntregasPage() {
  await requireCapability("ver_entregas");
  return (
    <ComingSoon
      icon={Bike}
      title="Mis entregas"
      description="Aquí verás los deliveries que te asignen. El módulo de delivery llega en una próxima entrega."
    />
  );
}
