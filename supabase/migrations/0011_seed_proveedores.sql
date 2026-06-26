-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA 8: datos de demostración (proveedores)
-- Nombres alineados con los proveedores ya usados en los lotes (Tanda 3)
-- para que el detalle muestre lo realmente surtido.
-- ───────────────────────────────────────────────────────────────

insert into public.proveedores (nombre, tipo, telefono, email, rnc, direccion)
select v.nombre, v.tipo, v.telefono, v.email, v.rnc, v.direccion
from (values
  ('Distribuidora Corripio','distribuidor','809-565-1000','ventas@corripio.com.do','1-01-02345-6','Av. John F. Kennedy, Santo Domingo'),
  ('Farmacéutica Carol','distribuidor','809-540-2000','pedidos@carol.com.do','1-01-03456-7','Av. 27 de Febrero, Santo Domingo'),
  ('Farmacia Hispaniola Dist.','distribuidor','809-555-3000','contacto@hispaniola.com.do','1-30-04567-8','Santiago de los Caballeros'),
  ('Pfizer Dominicana','laboratorio','809-566-4000','rd@pfizer.com','1-01-05678-9','Ensanche Naco, Santo Domingo'),
  ('Bayer Dominicana','laboratorio','809-566-5000','rd@bayer.com','1-01-06789-0','Piantini, Santo Domingo'),
  ('MSD Dominicana','laboratorio','809-567-6000','info@msd.com.do','1-01-07890-1','La Esperilla, Santo Domingo'),
  ('Merck RD','laboratorio','829-567-7000','rd@merck.com','1-01-08901-2','Av. Lope de Vega, Santo Domingo'),
  ('Novartis RD','laboratorio','829-568-8000','rd@novartis.com','1-01-09012-3','Av. Winston Churchill, Santo Domingo'),
  ('Sanofi Caribe','laboratorio','849-568-9000','caribe@sanofi.com','1-01-10123-4','Santo Domingo'),
  ('Grünenthal RD','laboratorio','809-569-1000','rd@grunenthal.com','1-01-11234-5','Santo Domingo'),
  ('Roche Dominicana','laboratorio','809-569-2000','rd@roche.com','1-01-12345-6','Santo Domingo'),
  ('Procter RD','distribuidor','809-569-3000','rd@pg.com','1-01-13456-7','Santo Domingo')
) as v(nombre, tipo, telefono, email, rnc, direccion)
where not exists (select 1 from public.proveedores p where p.nombre = v.nombre);

-- Backfill: vincular lotes existentes a su proveedor por nombre.
update public.lotes l
set proveedor_id = p.id
from public.proveedores p
where l.proveedor = p.nombre and l.proveedor_id is null;
