import { Package } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function InventarioPage() {
  return (
    <ComingSoon
      icon={Package}
      title="Inventario"
      description="Catálogo de productos, lotes, vencimientos y niveles de stock. Lo construimos en una próxima entrega."
    />
  );
}
