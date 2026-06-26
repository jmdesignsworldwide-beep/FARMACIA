import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ConfiguracionPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Configuración"
      description="Usuarios, permisos, datos de la farmacia e impuestos. Lo construimos en una próxima entrega."
    />
  );
}
