-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA 7: datos de demostración (clientes + delivery)
-- ───────────────────────────────────────────────────────────────
do $$
declare
  v_pedro uuid;
  c_carmen uuid; c_rafael uuid; c_juana uuid; c_jose uuid;
begin
  select id into v_pedro from public.profiles where username = 'pedro';

  -- Clientes
  if not exists (select 1 from public.clientes where cedula = '402-1122334-5') then
    insert into public.clientes (nombre, cedula, telefono, fecha_nacimiento, alergias, frecuente, empleado_nombre)
    values ('Carmen Jiménez','402-1122334-5','809-555-1010','1985-03-12', array['Penicilina'], true, 'María Pérez') returning id into c_carmen;
  else select id into c_carmen from public.clientes where cedula='402-1122334-5'; end if;

  if not exists (select 1 from public.clientes where cedula = '001-9988776-6') then
    insert into public.clientes (nombre, cedula, telefono, fecha_nacimiento, alergias, balance, empleado_nombre)
    values ('Rafael Núñez','001-9988776-6','829-555-2020','1970-07-22', array['Sulfas','AINEs'], 350.00, 'Ana Gómez') returning id into c_rafael;
  else select id into c_rafael from public.clientes where cedula='001-9988776-6'; end if;

  if not exists (select 1 from public.clientes where cedula = '223-4455667-8') then
    insert into public.clientes (nombre, cedula, telefono, fecha_nacimiento, alergias, frecuente, empleado_nombre)
    values ('Juana Díaz','223-4455667-8','849-555-3030','1992-11-05', '{}', true, 'María Pérez') returning id into c_juana;
  else select id into c_juana from public.clientes where cedula='223-4455667-8'; end if;

  if not exists (select 1 from public.clientes where cedula = '402-7788990-1') then
    insert into public.clientes (nombre, cedula, telefono, fecha_nacimiento, alergias, empleado_nombre)
    values ('José Castillo','402-7788990-1','809-555-4040','1965-01-30', array['Aspirina'], 'José Rodríguez') returning id into c_jose;
  else select id into c_jose from public.clientes where cedula='402-7788990-1'; end if;

  if not exists (select 1 from public.clientes where cedula = '001-3344556-7') then
    insert into public.clientes (nombre, cedula, telefono, fecha_nacimiento, empleado_nombre)
    values ('María Fernández','001-3344556-7','829-555-5050','2000-09-18', 'María Pérez');
  end if;

  -- Deliveries
  if not exists (select 1 from public.deliveries where direccion like 'Calle Restauración%') then
    insert into public.deliveries (cliente_id, cliente_nombre, telefono, direccion, sector, detalle, monto, metodo_pago, motorista_id, motorista_nombre, estado, empleado_nombre) values
      (c_carmen,'Carmen Jiménez','809-555-1010','Calle Restauración #45','Los Jardines, Santiago','Amoxicilina, Vitaminas', 850.00,'efectivo', v_pedro,'Pedro Santos','en_camino','Ana Gómez'),
      (c_rafael,'Rafael Núñez','829-555-2020','Av. 27 de Febrero #120','Ensanche Naco, Santo Domingo','Losartán, Metformina', 1200.00,'transferencia', v_pedro,'Pedro Santos','pendiente','Ana Gómez'),
      (c_juana,'Juana Díaz','849-555-3030','Calle Beller #8','Centro, Santiago','Acetaminofén', 430.00,'efectivo', v_pedro,'Pedro Santos','entregado','María Pérez'),
      (c_jose,'José Castillo','809-555-4040','Av. Estrella Sadhalá #30','La Trinitaria, Santiago','Omeprazol, Loratadina', 600.00,'tarjeta_credito', null, null,'pendiente','José Rodríguez');
    update public.deliveries set entregado_at = now() - interval '3 hours' where estado='entregado';
  end if;
end $$;
