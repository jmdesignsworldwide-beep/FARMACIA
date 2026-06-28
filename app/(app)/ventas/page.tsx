import { Reveal } from "@/components/motion/reveal";
import { VentasNav } from "@/components/ventas/ventas-nav";
import { POS } from "@/components/ventas/pos";
import { getProductosVendibles, getCajaActual, getMasVendidosIds, getProveedorPorProducto } from "@/lib/data/ventas";
import { getClientesBasico } from "@/lib/data/clientes";
import { getConfig } from "@/lib/data/config";
import { requireCapability } from "@/lib/auth/guard";
import type { ProductoVendible } from "@/lib/data/ventas-shared";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const emp = await requireCapability("usar_pos");
  const [productos, caja, clientes, config, prov, topIds] = await Promise.all([
    getProductosVendibles(),
    getCajaActual(),
    getClientesBasico(),
    getConfig(),
    getProveedorPorProducto(),
    getMasVendidosIds(),
  ]);

  // Más vendidos (real); si hay pocos, completa con muestra creíble del catálogo en stock.
  const byId = new Map(productos.map((p) => [p.id, p]));
  const mas: ProductoVendible[] = [];
  for (const id of topIds) {
    const p = byId.get(id);
    if (p) mas.push(p);
  }
  if (mas.length < 4) {
    for (const p of productos) {
      if (mas.length >= 8) break;
      if (!mas.some((m) => m.id === p.id)) mas.push(p);
    }
  }
  const masVendidos = mas.slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Punto de venta</h1>
            <p className="mt-1 text-sm text-muted-foreground">Busca, agrega al carrito y cobra. El stock baja por FEFO automáticamente.</p>
          </div>
          <VentasNav />
        </div>
      </Reveal>

      <POS productos={productos} clientes={clientes} cajaAbierta={Boolean(caja)}
        farmacia={config.nombre_farmacia} empleado={emp.full_name ?? emp.username}
        proveedores={prov.proveedores} proveedorPorProducto={prov.mapa} masVendidos={masVendidos} />
    </div>
  );
}
