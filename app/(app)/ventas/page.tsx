import { ShoppingCart } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function VentasPage() {
  return (
    <ComingSoon
      icon={ShoppingCart}
      title="Ventas"
      description="Punto de venta rápido, facturación y registro de transacciones. Lo construimos en una próxima entrega."
    />
  );
}
