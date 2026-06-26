import { Truck } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ComprasPage() {
  return (
    <ComingSoon
      icon={Truck}
      title="Compras"
      description="Órdenes a proveedores, recepción de mercancía y costos. Lo construimos en una próxima entrega."
    />
  );
}
