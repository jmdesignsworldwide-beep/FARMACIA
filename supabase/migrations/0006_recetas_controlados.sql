-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA 6: Recetas + Libro de controlados
-- El POS (Tanda 4) ya captura médico/paciente/receta al vender un
-- controlado. Aquí esos datos se GUARDAN como receta y se asientan en
-- el LIBRO DE CONTROLADOS (asiento permanente, no borrable).
-- ───────────────────────────────────────────────────────────────

-- ── RECETAS ────────────────────────────────────────────────────
create table if not exists public.recetas (
  id               uuid primary key default gen_random_uuid(),
  numero           text not null,
  medico_nombre    text not null,
  medico_colegiatura text,
  paciente_nombre  text not null,
  paciente_cedula  text,
  fecha            date not null default current_date,
  notas            text,
  controlada       boolean not null default false,
  origen           text not null default 'manual' check (origen in ('manual','pos')),
  estado           text not null default 'registrada' check (estado in ('registrada','despachada')),
  foto_url         text,
  venta_id         uuid references public.ventas (id) on delete set null,
  empleado_id      uuid references auth.users (id) on delete set null,
  empleado_nombre  text,
  created_at       timestamptz not null default now()
);
create index if not exists recetas_created_idx on public.recetas (created_at desc);
create index if not exists recetas_paciente_idx on public.recetas (paciente_nombre);

create table if not exists public.receta_items (
  id                uuid primary key default gen_random_uuid(),
  receta_id         uuid not null references public.recetas (id) on delete cascade,
  producto_id       uuid references public.productos (id) on delete set null,
  nombre_medicamento text not null,
  cantidad          integer not null default 1,
  indicaciones      text,
  controlado        boolean not null default false
);
create index if not exists receta_items_receta_idx on public.receta_items (receta_id);

-- ── LIBRO DE CONTROLADOS (asiento permanente) ──────────────────
create table if not exists public.libro_controlados (
  id               uuid primary key default gen_random_uuid(),
  receta_id        uuid references public.recetas (id) on delete set null,
  venta_id         uuid references public.ventas (id) on delete set null,
  producto_id      uuid references public.productos (id) on delete set null,
  producto_nombre  text not null,
  cantidad         integer not null,
  medico_nombre    text,
  medico_colegiatura text,
  paciente_nombre  text,
  paciente_cedula  text,
  numero_receta    text,
  empleado_id      uuid references auth.users (id) on delete set null,
  empleado_nombre  text,
  created_at       timestamptz not null default now()
);
create index if not exists libro_created_idx on public.libro_controlados (created_at desc);
create index if not exists libro_producto_idx on public.libro_controlados (producto_id);

comment on table public.libro_controlados is 'Libro de medicamentos controlados. Asiento permanente: no se edita ni borra.';

-- ── Seguridad: RLS + FORCE + políticas (autenticados) ──────────
do $$
declare t text;
begin
  foreach t in array array['recetas','receta_items','libro_controlados'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format('drop policy if exists "%s_auth_all" on public.%I;', t, t);
    execute format(
      'create policy "%s_auth_all" on public.%I for all to authenticated using (true) with check (true);',
      t, t);
  end loop;
end $$;

-- El libro de controlados es un asiento permanente: no UPDATE/DELETE/TRUNCATE.
revoke update, delete on public.libro_controlados from authenticated, anon, public;
create or replace function public.libro_inmutable()
returns trigger language plpgsql as $$
begin
  raise exception 'El libro de controlados es un asiento permanente: la operación % no está permitida.', tg_op
    using errcode = 'insufficient_privilege';
end $$;
drop trigger if exists trg_libro_no_update on public.libro_controlados;
create trigger trg_libro_no_update before update on public.libro_controlados for each row execute function public.libro_inmutable();
drop trigger if exists trg_libro_no_delete on public.libro_controlados;
create trigger trg_libro_no_delete before delete on public.libro_controlados for each row execute function public.libro_inmutable();
drop trigger if exists trg_libro_no_truncate on public.libro_controlados;
create trigger trg_libro_no_truncate before truncate on public.libro_controlados for each statement execute function public.libro_inmutable();

-- ── registrar_venta EXTENDIDA: asienta receta + libro al despachar controlados ──
create or replace function public.registrar_venta(
  p_items jsonb, p_metodo text, p_descuento numeric default 0,
  p_monto_recibido numeric default null, p_voucher text default null, p_receta jsonb default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_caja uuid; v_sub numeric := 0; v_total numeric; v_cambio numeric := 0;
  v_venta uuid; v_folio bigint; it jsonb;
  v_pid uuid; v_cant int; v_precio numeric; v_ldesc numeric; v_line numeric;
  v_rem int; v_take int; v_nombre text; v_usados jsonb; v_emp text; v_ctrl boolean;
  lote record; v_controlados jsonb := '[]'::jsonb; c jsonb; v_receta uuid;
begin
  if v_uid is null then raise exception 'No autorizado'; end if;
  select coalesce(full_name, username) into v_emp from public.profiles where id = v_uid;
  if jsonb_array_length(coalesce(p_items,'[]'::jsonb)) = 0 then raise exception 'El carrito está vacío'; end if;

  select id into v_caja from public.cajas where estado = 'abierta' order by abierta_at desc limit 1;
  if v_caja is null then raise exception 'Debes abrir la caja antes de vender'; end if;

  for it in select * from jsonb_array_elements(p_items) loop
    v_sub := v_sub + (it->>'cantidad')::int * (it->>'precio_unitario')::numeric - coalesce((it->>'descuento')::numeric, 0);
  end loop;
  v_total := greatest(v_sub - coalesce(p_descuento, 0), 0);

  if p_metodo = 'efectivo' then
    if coalesce(p_monto_recibido, 0) < v_total then raise exception 'El monto recibido es menor que el total'; end if;
    v_cambio := coalesce(p_monto_recibido, 0) - v_total;
  end if;

  insert into public.ventas
    (caja_id, subtotal, descuento, total, metodo_pago, monto_recibido, cambio, voucher,
     receta_medico, receta_paciente, receta_numero, empleado_id, empleado_nombre)
  values
    (v_caja, v_sub, coalesce(p_descuento,0), v_total, p_metodo, p_monto_recibido, v_cambio, p_voucher,
     p_receta->>'medico', p_receta->>'paciente', p_receta->>'numero', v_uid, v_emp)
  returning id, folio into v_venta, v_folio;

  for it in select * from jsonb_array_elements(p_items) loop
    v_pid := (it->>'producto_id')::uuid;
    v_cant := (it->>'cantidad')::int;
    v_precio := (it->>'precio_unitario')::numeric;
    v_ldesc := coalesce((it->>'descuento')::numeric, 0);
    v_line := v_cant * v_precio - v_ldesc;
    v_rem := v_cant; v_usados := '[]'::jsonb;

    for lote in
      select * from public.lotes where producto_id = v_pid and cantidad > 0
      order by fecha_vencimiento asc, created_at asc for update
    loop
      exit when v_rem <= 0;
      v_take := least(lote.cantidad, v_rem);
      update public.lotes set cantidad = cantidad - v_take where id = lote.id;
      insert into public.movimientos_inventario (producto_id, lote_id, tipo, cantidad, motivo, usuario_id)
      values (v_pid, lote.id, 'salida', -v_take, 'Venta #' || v_folio, v_uid);
      v_usados := v_usados || jsonb_build_object('lote_id', lote.id, 'numero_lote', lote.numero_lote, 'cantidad', v_take, 'fecha_vencimiento', lote.fecha_vencimiento);
      v_rem := v_rem - v_take;
    end loop;
    if v_rem > 0 then raise exception 'Stock insuficiente para %', (select nombre_comercial from public.productos where id = v_pid); end if;

    select nombre_comercial, controlado into v_nombre, v_ctrl from public.productos where id = v_pid;
    insert into public.venta_items (venta_id, producto_id, nombre_producto, cantidad, precio_unitario, descuento, subtotal, lotes_usados)
    values (v_venta, v_pid, coalesce(v_nombre,'Producto'), v_cant, v_precio, v_ldesc, v_line, v_usados);

    if v_ctrl then
      v_controlados := v_controlados || jsonb_build_object('producto_id', v_pid, 'nombre', v_nombre, 'cantidad', v_cant);
    end if;
  end loop;

  -- Cerrar el círculo: si se despachó un controlado y hay datos de receta,
  -- crear la receta y asentar cada controlado en el libro.
  if jsonb_array_length(v_controlados) > 0
     and p_receta is not null
     and coalesce(p_receta->>'numero', p_receta->>'medico') is not null then
    insert into public.recetas (numero, medico_nombre, paciente_nombre, paciente_cedula, fecha,
      controlada, origen, estado, venta_id, empleado_id, empleado_nombre)
    values (coalesce(nullif(p_receta->>'numero',''),'S/N'), coalesce(p_receta->>'medico','—'),
      coalesce(p_receta->>'paciente','—'), p_receta->>'cedula', current_date,
      true, 'pos', 'despachada', v_venta, v_uid, v_emp)
    returning id into v_receta;

    for c in select * from jsonb_array_elements(v_controlados) loop
      insert into public.receta_items (receta_id, producto_id, nombre_medicamento, cantidad, controlado)
      values (v_receta, (c->>'producto_id')::uuid, c->>'nombre', (c->>'cantidad')::int, true);
      insert into public.libro_controlados (receta_id, venta_id, producto_id, producto_nombre, cantidad,
        medico_nombre, paciente_nombre, paciente_cedula, numero_receta, empleado_id, empleado_nombre)
      values (v_receta, v_venta, (c->>'producto_id')::uuid, c->>'nombre', (c->>'cantidad')::int,
        p_receta->>'medico', p_receta->>'paciente', p_receta->>'cedula', p_receta->>'numero', v_uid, v_emp);
    end loop;

    perform public.log_actividad(v_uid, 'receta_despachada',
      'Receta despachada #' || coalesce(nullif(p_receta->>'numero',''),'S/N') || ' (controlado)',
      jsonb_build_object('paciente', p_receta->>'paciente', 'medico', p_receta->>'medico'),
      'recetas', v_receta);
  end if;

  return jsonb_build_object('venta_id', v_venta, 'folio', v_folio, 'total', v_total, 'cambio', v_cambio);
end $$;

grant select, insert, update, delete on public.recetas, public.receta_items to authenticated;
grant select, insert on public.libro_controlados to authenticated;
