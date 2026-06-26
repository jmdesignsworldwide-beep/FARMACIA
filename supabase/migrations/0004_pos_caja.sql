-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA 4: POS / Ventas + Caja (el corazón)
-- Una venta: descuenta stock por FEFO del modelo de Tanda 3 (lotes +
-- movimientos), registra la venta, suma a la caja del día. Todo atómico.
-- Seguridad: RLS + FORCE en todas las tablas nuevas.
-- ───────────────────────────────────────────────────────────────

-- ── CAJAS (apertura/cierre por turno) ──────────────────────────
create table if not exists public.cajas (
  id            uuid primary key default gen_random_uuid(),
  estado        text not null default 'abierta' check (estado in ('abierta','cerrada')),
  monto_inicial numeric(12,2) not null default 0 check (monto_inicial >= 0),
  monto_contado numeric(12,2),
  diferencia    numeric(12,2),
  notas         text,
  abierta_por   uuid references auth.users (id) on delete set null,
  abierta_at    timestamptz not null default now(),
  cerrada_por   uuid references auth.users (id) on delete set null,
  cerrada_at    timestamptz
);
-- Solo una caja abierta a la vez.
create unique index if not exists cajas_una_abierta on public.cajas (estado) where estado = 'abierta';

-- ── VENTAS ─────────────────────────────────────────────────────
create table if not exists public.ventas (
  id                uuid primary key default gen_random_uuid(),
  folio             bigint generated always as identity,
  caja_id           uuid references public.cajas (id) on delete set null,
  subtotal          numeric(12,2) not null default 0,
  descuento         numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  metodo_pago       text not null check (metodo_pago in ('efectivo','transferencia','tarjeta_debito','tarjeta_credito')),
  monto_recibido    numeric(12,2),
  cambio            numeric(12,2) not null default 0,
  voucher           text,
  estado            text not null default 'completada' check (estado in ('completada','anulada')),
  receta_medico     text,
  receta_paciente   text,
  receta_numero     text,
  empleado_id       uuid references auth.users (id) on delete set null,
  empleado_nombre   text,
  anulada_por       uuid references auth.users (id) on delete set null,
  anulada_nombre    text,
  anulada_at        timestamptz,
  motivo_anulacion  text,
  created_at        timestamptz not null default now()
);
create index if not exists ventas_created_idx on public.ventas (created_at desc);
create index if not exists ventas_caja_idx on public.ventas (caja_id);

create table if not exists public.venta_items (
  id              uuid primary key default gen_random_uuid(),
  venta_id        uuid not null references public.ventas (id) on delete cascade,
  producto_id     uuid references public.productos (id) on delete set null,
  nombre_producto text not null,
  cantidad        integer not null check (cantidad > 0),
  precio_unitario numeric(12,2) not null,
  descuento       numeric(12,2) not null default 0,
  subtotal        numeric(12,2) not null,
  lotes_usados    jsonb not null default '[]'::jsonb
);
create index if not exists venta_items_venta_idx on public.venta_items (venta_id);

-- ── EGRESOS DE CAJA ────────────────────────────────────────────
create table if not exists public.caja_egresos (
  id              uuid primary key default gen_random_uuid(),
  caja_id         uuid not null references public.cajas (id) on delete cascade,
  monto           numeric(12,2) not null check (monto > 0),
  motivo          text not null,
  registrado_por  uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists caja_egresos_caja_idx on public.caja_egresos (caja_id);

-- ── SEGURIDAD: RLS + FORCE + políticas (autenticados) ──────────
do $$
declare t text;
begin
  foreach t in array array['cajas','ventas','venta_items','caja_egresos'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format('drop policy if exists "%s_auth_all" on public.%I;', t, t);
    execute format(
      'create policy "%s_auth_all" on public.%I for all to authenticated using (true) with check (true);',
      t, t);
  end loop;
end $$;

-- ── FUNCIÓN: abrir caja ────────────────────────────────────────
create or replace function public.abrir_caja(p_monto_inicial numeric)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'No autorizado'; end if;
  if exists (select 1 from public.cajas where estado = 'abierta') then
    raise exception 'Ya hay una caja abierta';
  end if;
  insert into public.cajas (monto_inicial, abierta_por)
  values (greatest(coalesce(p_monto_inicial,0),0), v_uid)
  returning id into v_id;
  return v_id;
end $$;

-- ── FUNCIÓN: registrar venta (FEFO + atómica) — EL CORAZÓN ─────
create or replace function public.registrar_venta(
  p_items jsonb,                 -- [{producto_id, cantidad, precio_unitario, descuento}]
  p_metodo text,
  p_descuento numeric default 0,
  p_monto_recibido numeric default null,
  p_voucher text default null,
  p_receta jsonb default null    -- {medico, paciente, numero}
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_caja uuid;
  v_sub numeric := 0;
  v_total numeric;
  v_cambio numeric := 0;
  v_venta uuid;
  v_folio bigint;
  it jsonb;
  v_pid uuid; v_cant int; v_precio numeric; v_ldesc numeric; v_line numeric;
  v_rem int; v_take int; v_nombre text; v_usados jsonb; v_emp text;
  lote record;
begin
  if v_uid is null then raise exception 'No autorizado'; end if;
  select username into v_emp from public.profiles where id = v_uid;
  if jsonb_array_length(coalesce(p_items,'[]'::jsonb)) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  select id into v_caja from public.cajas where estado = 'abierta' order by abierta_at desc limit 1;
  if v_caja is null then raise exception 'Debes abrir la caja antes de vender'; end if;

  -- Subtotal (sin tocar stock todavía)
  for it in select * from jsonb_array_elements(p_items) loop
    v_sub := v_sub + (it->>'cantidad')::int * (it->>'precio_unitario')::numeric
                   - coalesce((it->>'descuento')::numeric, 0);
  end loop;
  v_total := greatest(v_sub - coalesce(p_descuento, 0), 0);

  if p_metodo = 'efectivo' then
    if coalesce(p_monto_recibido, 0) < v_total then
      raise exception 'El monto recibido es menor que el total';
    end if;
    v_cambio := coalesce(p_monto_recibido, 0) - v_total;
  end if;

  insert into public.ventas
    (caja_id, subtotal, descuento, total, metodo_pago, monto_recibido, cambio, voucher,
     receta_medico, receta_paciente, receta_numero, empleado_id, empleado_nombre)
  values
    (v_caja, v_sub, coalesce(p_descuento,0), v_total, p_metodo, p_monto_recibido, v_cambio, p_voucher,
     p_receta->>'medico', p_receta->>'paciente', p_receta->>'numero', v_uid, v_emp)
  returning id, folio into v_venta, v_folio;

  -- Descuento de stock por FEFO + items
  for it in select * from jsonb_array_elements(p_items) loop
    v_pid := (it->>'producto_id')::uuid;
    v_cant := (it->>'cantidad')::int;
    v_precio := (it->>'precio_unitario')::numeric;
    v_ldesc := coalesce((it->>'descuento')::numeric, 0);
    v_line := v_cant * v_precio - v_ldesc;
    v_rem := v_cant;
    v_usados := '[]'::jsonb;

    for lote in
      select * from public.lotes
      where producto_id = v_pid and cantidad > 0
      order by fecha_vencimiento asc, created_at asc
      for update
    loop
      exit when v_rem <= 0;
      v_take := least(lote.cantidad, v_rem);
      update public.lotes set cantidad = cantidad - v_take where id = lote.id;
      insert into public.movimientos_inventario (producto_id, lote_id, tipo, cantidad, motivo, usuario_id)
      values (v_pid, lote.id, 'salida', -v_take, 'Venta #' || v_folio, v_uid);
      v_usados := v_usados || jsonb_build_object(
        'lote_id', lote.id, 'numero_lote', lote.numero_lote,
        'cantidad', v_take, 'fecha_vencimiento', lote.fecha_vencimiento);
      v_rem := v_rem - v_take;
    end loop;

    if v_rem > 0 then
      raise exception 'Stock insuficiente para %', (select nombre_comercial from public.productos where id = v_pid);
    end if;

    select nombre_comercial into v_nombre from public.productos where id = v_pid;
    insert into public.venta_items
      (venta_id, producto_id, nombre_producto, cantidad, precio_unitario, descuento, subtotal, lotes_usados)
    values (v_venta, v_pid, coalesce(v_nombre,'Producto'), v_cant, v_precio, v_ldesc, v_line, v_usados);
  end loop;

  return jsonb_build_object('venta_id', v_venta, 'folio', v_folio, 'total', v_total, 'cambio', v_cambio);
end $$;

-- ── FUNCIÓN: anular venta (devuelve stock) ─────────────────────
create or replace function public.anular_venta(p_venta_id uuid, p_motivo text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_folio bigint;
  v_estado text;
  v_emp text;
  item record;
  uso jsonb;
begin
  if v_uid is null then raise exception 'No autorizado'; end if;
  if coalesce(trim(p_motivo),'') = '' then raise exception 'El motivo de anulación es obligatorio'; end if;
  select username into v_emp from public.profiles where id = v_uid;

  select estado, folio into v_estado, v_folio from public.ventas where id = p_venta_id for update;
  if v_estado is null then raise exception 'Venta no encontrada'; end if;
  if v_estado = 'anulada' then raise exception 'La venta ya está anulada'; end if;

  -- Devolver stock a cada lote usado
  for item in select * from public.venta_items where venta_id = p_venta_id loop
    for uso in select * from jsonb_array_elements(item.lotes_usados) loop
      update public.lotes set cantidad = cantidad + (uso->>'cantidad')::int
        where id = (uso->>'lote_id')::uuid;
      insert into public.movimientos_inventario (producto_id, lote_id, tipo, cantidad, motivo, usuario_id)
      values (item.producto_id, (uso->>'lote_id')::uuid, 'ajuste', (uso->>'cantidad')::int,
              'Anulación de venta #' || v_folio, v_uid);
    end loop;
  end loop;

  update public.ventas
    set estado = 'anulada', anulada_por = v_uid, anulada_nombre = v_emp,
        anulada_at = now(), motivo_anulacion = p_motivo
    where id = p_venta_id;
end $$;

-- ── FUNCIÓN: cerrar caja con arqueo ────────────────────────────
create or replace function public.cerrar_caja(p_monto_contado numeric, p_notas text default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_caja uuid; v_inicial numeric; v_efectivo numeric; v_egresos numeric; v_esperado numeric; v_dif numeric;
begin
  if v_uid is null then raise exception 'No autorizado'; end if;
  select id, monto_inicial into v_caja, v_inicial from public.cajas where estado = 'abierta' order by abierta_at desc limit 1;
  if v_caja is null then raise exception 'No hay caja abierta'; end if;

  select coalesce(sum(total),0) into v_efectivo from public.ventas
    where caja_id = v_caja and estado = 'completada' and metodo_pago = 'efectivo';
  select coalesce(sum(monto),0) into v_egresos from public.caja_egresos where caja_id = v_caja;

  v_esperado := v_inicial + v_efectivo - v_egresos;
  v_dif := coalesce(p_monto_contado,0) - v_esperado;

  update public.cajas
    set estado = 'cerrada', monto_contado = coalesce(p_monto_contado,0), diferencia = v_dif,
        cerrada_por = v_uid, cerrada_at = now(), notas = p_notas
    where id = v_caja;

  return jsonb_build_object('esperado', v_esperado, 'contado', coalesce(p_monto_contado,0), 'diferencia', v_dif);
end $$;

-- ── Grants (la RLS sigue gobernando) ───────────────────────────
grant select, insert, update, delete
  on public.cajas, public.ventas, public.venta_items, public.caja_egresos
  to authenticated;
grant execute on function public.abrir_caja(numeric) to authenticated;
grant execute on function public.registrar_venta(jsonb, text, numeric, numeric, text, jsonb) to authenticated;
grant execute on function public.anular_venta(uuid, text) to authenticated;
grant execute on function public.cerrar_caja(numeric, text) to authenticated;
