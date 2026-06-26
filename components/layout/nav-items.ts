import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  History,
  BarChart3,
  Settings,
  Bike,
  FileText,
  Contact,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { Capacidad } from "@/lib/auth/roles";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  cap: Capacidad;
  soon?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Panel", href: "/dashboard", icon: LayoutDashboard, cap: "ver_dashboard" },
  { label: "Punto de venta", href: "/ventas", icon: ShoppingCart, cap: "usar_pos" },
  { label: "Inventario", href: "/inventario", icon: Package, cap: "ver_inventario" },
  { label: "Proveedores", href: "/proveedores", icon: Truck, cap: "ver_proveedores" },
  { label: "Recetas", href: "/recetas", icon: FileText, cap: "ver_recetas" },
  { label: "Clientes", href: "/clientes", icon: Contact, cap: "ver_clientes" },
  { label: "Delivery", href: "/deliveries", icon: Bike, cap: "ver_deliveries" },
  { label: "Empleados", href: "/empleados", icon: Users, cap: "ver_empleados" },
  { label: "Historial", href: "/actividad", icon: History, cap: "ver_historial" },
  { label: "Reportes", href: "/reportes", icon: BarChart3, cap: "ver_reportes", soon: true },
  { label: "Configuración", href: "/configuracion", icon: Settings, cap: "gestionar_empleados", soon: true },
];
