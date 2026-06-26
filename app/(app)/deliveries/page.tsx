import Link from "next/link";
import { Plus, Clock, Truck, PackageCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeliveryLista } from "@/components/deliveries/delivery-lista";
import { DisclaimerDelivery } from "@/components/deliveries/disclaimer-delivery";
import { requireCapability } from "@/lib/auth/guard";
import { getDeliveries } from "@/lib/data/deliveries";
import { can } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const emp = await requireCapability("ver_deliveries");
  // El motorista solo ve sus asignaciones.
  const soloMias = emp.rol === "motorista" ? emp.id : undefined;
  const deliveries = await getDeliveries({ motoristaId: soloMias });

  const pendientes = deliveries.filter((d) => d.estado === "pendiente").length;
  const enCamino = deliveries.filter((d) => d.estado === "en_camino").length;
  const entregados = deliveries.filter((d) => d.estado === "entregado").length;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Delivery</h1>
            <p className="mt-1 text-sm text-muted-foreground">{soloMias ? "Tus entregas asignadas." : "Órdenes de delivery y su estado."}</p>
          </div>
          {can(emp.rol, "gestionar_deliveries") && (
            <Link href="/deliveries/nueva"><Button size="sm"><Plus className="h-4 w-4" /> Nuevo delivery</Button></Link>
          )}
        </div>
      </Reveal>

      <div className="grid grid-cols-3 gap-3">
        <Mini icon={Clock} label="Pendientes" value={pendientes} />
        <Mini icon={Truck} label="En camino" value={enCamino} />
        <Mini icon={PackageCheck} label="Entregados" value={entregados} />
      </div>

      <Reveal><DisclaimerDelivery /></Reveal>

      <DeliveryLista deliveries={deliveries} />
    </div>
  );
}

function Mini({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div>
      <p className="tabular mt-1 text-2xl font-semibold"><CountUp value={value} /></p>
    </Card>
  );
}
