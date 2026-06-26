import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { DeliveryForm } from "@/components/deliveries/delivery-form";
import { DisclaimerDelivery } from "@/components/deliveries/disclaimer-delivery";
import { requireCapability } from "@/lib/auth/guard";
import { getClientesBasico } from "@/lib/data/clientes";
import { getMotoristas } from "@/lib/data/deliveries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo delivery — JM Farmacia" };

export default async function NuevoDeliveryPage() {
  await requireCapability("gestionar_deliveries");
  const [clientes, motoristas] = await Promise.all([getClientesBasico(), getMotoristas()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Reveal>
        <Link href="/deliveries" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a delivery
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo delivery</h1>
      </Reveal>
      <Reveal delay={0.05}><DeliveryForm clientes={clientes} motoristas={motoristas} /></Reveal>
      <Reveal><DisclaimerDelivery /></Reveal>
    </div>
  );
}
