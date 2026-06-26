import { Users } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ClientesPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Clientes"
      description="Historial de compras, recetas frecuentes y fidelización. Lo construimos en una próxima entrega."
    />
  );
}
