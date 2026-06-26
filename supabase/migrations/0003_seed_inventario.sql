-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA 3: Datos de demostración (catálogo dominicano)
-- Medicamentos reales, laboratorios, precios RD$ lógicos, lotes con
-- vencimientos relativos a HOY (para que las alertas se vean vivas).
-- Vencimientos usan current_date + N días => siempre vigentes.
-- ───────────────────────────────────────────────────────────────

insert into public.productos
  (nombre_comercial, nombre_generico, laboratorio, concentracion, presentacion, categoria, codigo_barras, precio_costo, precio_venta, controlado, requiere_receta, stock_minimo)
values
  ('Panadol','Acetaminofén','GSK','500 mg','Caja 20 tabletas','Analgésicos','7460010012345',3.50,6.00,false,false,40),
  ('Advil','Ibuprofeno','Pfizer','400 mg','Caja 24 tabletas','Analgésicos','7460010012346',5.00,9.00,false,false,30),
  ('Voltaren','Diclofenaco','Novartis','50 mg','Caja 20 tabletas','Analgésicos','7460010012347',6.50,12.00,false,true,20),
  ('Amoxil','Amoxicilina','GSK','500 mg','Caja 15 cápsulas','Antibióticos','7460010012348',8.00,15.00,false,true,25),
  ('Zitromax','Azitromicina','Pfizer','500 mg','Caja 6 tabletas','Antibióticos','7460010012349',18.00,32.00,false,true,15),
  ('Cipro','Ciprofloxacino','Bayer','500 mg','Caja 10 tabletas','Antibióticos','7460010012350',12.00,22.00,false,true,15),
  ('Cozaar','Losartán','MSD','50 mg','Caja 30 tabletas','Antihipertensivos','7460010012351',9.00,17.00,false,true,20),
  ('Norvasc','Amlodipino','Pfizer','5 mg','Caja 30 tabletas','Antihipertensivos','7460010012352',7.50,14.00,false,true,20),
  ('Vasotec','Enalapril','MSD','10 mg','Caja 20 tabletas','Antihipertensivos','7460010012353',5.50,11.00,false,true,20),
  ('Glucophage','Metformina','Merck','850 mg','Caja 30 tabletas','Diabetes','7460010012354',6.00,12.00,false,true,25),
  ('Lantus','Insulina glargina','Sanofi','100 U/ml','Vial 10 ml','Diabetes','7460010012355',85.00,145.00,false,true,8),
  ('Ventolin','Salbutamol','GSK','100 mcg','Inhalador 200 dosis','Respiratorios','7460010012356',14.00,26.00,false,true,12),
  ('Claritin','Loratadina','Bayer','10 mg','Caja 10 tabletas','Antialérgicos','7460010012357',4.50,8.50,false,false,30),
  ('Benadryl','Difenhidramina','Johnson & Johnson','12.5 mg/5ml','Jarabe 120 ml','Antialérgicos','7460010012358',5.00,9.50,false,false,15),
  ('Losec','Omeprazol','AstraZeneca','20 mg','Caja 14 cápsulas','Gastrointestinales','7460010012359',6.00,11.50,false,false,25),
  ('Lipitor','Atorvastatina','Pfizer','20 mg','Caja 30 tabletas','Antihipertensivos','7460010012360',11.00,20.00,false,true,20),
  ('Tramal','Tramadol','Grünenthal','50 mg','Caja 20 cápsulas','Analgésicos','7460010012361',15.00,28.00,true,true,10),
  ('Rivotril','Clonazepam','Roche','2 mg','Caja 30 tabletas','Neurológicos','7460010012362',12.00,24.00,true,true,10),
  ('Centrum','Multivitamínico','Pfizer','—','Frasco 100 tabletas','Vitaminas','7460010012363',9.00,18.00,false,false,15),
  ('Neurobión','Complejo B','Procter & Gamble','—','Caja 10 tabletas','Vitaminas','7460010012364',8.00,16.00,false,false,20)
on conflict (codigo_barras) where codigo_barras is not null do nothing;

-- ── LOTES ──────────────────────────────────────────────────────
-- Vencimiento = hoy + dias_venc · entrada = hoy - dias_entrada (date+int=date).
insert into public.lotes
  (producto_id, numero_lote, cantidad, fecha_vencimiento, proveedor, fecha_entrada)
select p.id, v.numero_lote, v.cantidad,
       current_date + v.dias_venc,
       v.proveedor,
       current_date - v.dias_entrada
from (values
  -- barcode, numero_lote, cantidad, dias_venc, proveedor, dias_entrada
  -- BAJO STOCK (cantidad total < mínimo)
  ('7460010012346','ADV-5520',11,365,'Distribuidora Corripio',40),
  ('7460010012353','VAS-3310',6,300,'Farmacia Hispaniola Dist.',60),
  ('7460010012356','VEN-7782',3,240,'Distribuidora Corripio',25),
  ('7460010012358','BEN-9015',4,510,'Farmacéutica Carol',20),
  -- POR VENCER <=30 días
  ('7460010012348','AMX-2291',34,12,'Distribuidora Corripio',90),
  ('7460010012350','CIP-1180',20,18,'Farmacéutica Carol',70),
  ('7460010012352','NOR-4417',26,26,'Farmacia Hispaniola Dist.',80),
  ('7460010012351','LOS-1187',18,21,'MSD Dominicana',85),
  ('7460010012359','OME-5530',52,28,'Farmacéutica Carol',60),
  -- POR VENCER 31-60 días
  ('7460010012354','MET-3340',27,44,'Merck RD',55),
  ('7460010012357','CLA-0921',40,51,'Bayer Dominicana',50),
  ('7460010012347','VOL-7782',22,58,'Novartis RD',45),
  -- POR VENCER 61-90 días
  ('7460010012360','ATV-4416',31,73,'Pfizer Dominicana',40),
  ('7460010012349','AZI-9015',15,88,'Pfizer Dominicana',30),
  -- STOCK SANO (vencimiento lejano)
  ('7460010012355','LAN-2210',14,210,'Sanofi Caribe',20),
  ('7460010012361','TRA-6650',24,330,'Grünenthal RD',25),
  ('7460010012362','RIV-8890',18,300,'Roche Dominicana',25),
  ('7460010012363','CEN-1120',60,480,'Pfizer Dominicana',15),
  ('7460010012364','NEU-7740',45,450,'Procter RD',15),
  -- Productos con dos lotes (stock total mayor)
  ('7460010012345','PAN-8841',8,420,'Farmacéutica Carol',35),
  ('7460010012345','PAN-9020',120,540,'Farmacéutica Carol',10),
  ('7460010012359','OME-7781',60,400,'Farmacéutica Carol',15)
) as v(barcode, numero_lote, cantidad, dias_venc, proveedor, dias_entrada)
join public.productos p on p.codigo_barras = v.barcode
on conflict (producto_id, numero_lote) do nothing;

-- Movimientos 'entrada' iniciales para el historial (uno por lote sembrado).
insert into public.movimientos_inventario (producto_id, lote_id, tipo, cantidad, motivo, created_at)
select l.producto_id, l.id, 'entrada', l.cantidad, 'Carga inicial de inventario',
       (l.fecha_entrada::timestamptz + time '09:00')
from public.lotes l
where not exists (
  select 1 from public.movimientos_inventario m where m.lote_id = l.id
);
