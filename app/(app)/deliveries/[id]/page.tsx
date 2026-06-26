import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Phone, User, Bike, Package, CreditCard } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { DeliveryEstado } from "@/components/deliveries/delivery-estado";
import { DisclaimerDelivery } from "@/components/deliveries/disclaimer-delivery";
import { requireCapability } from "@/lib/auth/guard";
import { can } from "@/lib/auth/roles";
import { getDelivery } from "@/lib/data/deliveries";
import { metodoLabel } from "@/lib/data/ventas-shared";
import { formatRD } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DeliveryDetallePage({ params }: { params: { id: string } }) {
  const emp = await requireCapability("ver_deliveries");
  const d = await getDelivery(params.id);
  if (!d) notFound();

  // El motorista solo ve sus propios deliveries.
  if (emp.rol === "motorista" && d.motorista_id !== emp.id) redirect("/deliveries");
  const puedeEditar = can(emp.rol, "gestionar_deliveries") || (emp.rol === "motorista" && d.motorista_id === emp.id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Reveal>
        <Link href="/deliveries" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a delivery
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Delivery #{d.folio}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{new Date(d.created_at).toLocaleString("es-DO", { dateStyle: "long", timeStyle: "short" })}</p>
      </Reveal>

      <Reveal><DeliveryEstado deliveryId={d.id} estado={d.estado} puedeEditar={puedeEditar} /></Reveal>

      <Reveal>
        <div className="glass grid grid-cols-1 gap-4 rounded-2xl p-5 shadow-elev-1 sm:grid-cols-2">
          <Dato icon={<User className="h-4 w-4" />} label="Cliente" value={d.cliente_nombre} sub={d.telefono ?? undefined} />
          <Dato icon={<MapPin className="h-4 w-4" />} label="Dirección" value={d.direccion} sub={d.sector ?? undefined} />
          <Dato icon={<Package className="h-4 w-4" />} label="Pedido" value={d.detalle ?? "—"} />
          <Dato icon={<CreditCard className="h-4 w-4" />} label="Cobro" value={`${formatRD(d.monto)}${d.metodo_pago ? ` · ${metodoLabel(d.metodo_pago)}` : ""}`} />
          <Dato icon={<Bike className="h-4 w-4" />} label="Motorista" value={d.motorista_nombre ?? "Sin asignar"} />
          {d.telefono && <Dato icon={<Phone className="h-4 w-4" />} label="Teléfono" value={d.telefono} />}
        </div>
      </Reveal>

      {d.notas && (
        <Reveal><div className="glass rounded-2xl p-5 shadow-elev-1"><h2 className="mb-1 text-sm font-semibold tracking-tight">Notas</h2><p className="text-sm text-muted-foreground">{d.notas}</p></div></Reveal>
      )}

      <Reveal><DisclaimerDelivery /></Reveal>
    </div>
  );
}

function Dato({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
