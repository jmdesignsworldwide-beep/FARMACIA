"use client";

import { TrendingUp, CalendarClock, PackageX, Wallet } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { KpiCard } from "./kpi-card";
import type { DashboardData } from "@/lib/data/dashboard";

/**
 * Los 4 KPIs grandes en cascada. Recibe solo datos serializables; los íconos
 * se definen aquí (no cruzan la frontera server→client).
 */
export function KpiGrid({ data }: { data: DashboardData }) {
  return (
    <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StaggerItem className="h-full">
        <KpiCard
          title="Ventas de hoy"
          href="/ventas"
          icon={TrendingUp}
          value={data.salesToday.amount}
          currency
          subtitle={`${data.salesToday.transactions} transacciones`}
          variant="positive"
        />
      </StaggerItem>

      <StaggerItem className="h-full">
        <KpiCard
          title="Productos por vencer"
          href="/inventario"
          icon={CalendarClock}
          value={data.expiring.within30}
          subtitle="Sin vencimientos próximos"
          alertSubtitle={`En ≤30 días · ${data.expiring.within90} en 90d`}
          variant="alert"
          alertActive={data.expiring.within30 > 0}
        />
      </StaggerItem>

      <StaggerItem className="h-full">
        <KpiCard
          title="Bajo stock"
          href="/inventario"
          icon={PackageX}
          value={data.lowStock.count}
          subtitle="Stock saludable"
          alertSubtitle="Productos bajo el mínimo"
          variant="alert"
          alertActive={data.lowStock.count > 0}
        />
      </StaggerItem>

      <StaggerItem className="h-full">
        <KpiCard
          title="Caja del día"
          href="/reportes"
          icon={Wallet}
          value={data.cashOnHand.amount}
          currency
          subtitle="En caja ahora mismo"
          variant="positive"
        />
      </StaggerItem>
    </Stagger>
  );
}
