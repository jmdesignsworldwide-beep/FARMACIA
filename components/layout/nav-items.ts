import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Indica módulos que llegan en tandas futuras (placeholder limpio). */
  soon?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Panel", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventario", href: "/inventario", icon: Package, soon: true },
  { label: "Ventas", href: "/ventas", icon: ShoppingCart, soon: true },
  { label: "Compras", href: "/compras", icon: Truck, soon: true },
  { label: "Clientes", href: "/clientes", icon: Users, soon: true },
  { label: "Reportes", href: "/reportes", icon: BarChart3, soon: true },
  { label: "Configuración", href: "/configuracion", icon: Settings, soon: true },
];
