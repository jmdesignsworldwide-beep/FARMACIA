-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA 5: Empleados + Roles + Historial INVIOLABLE
-- El historial (actividad) solo acepta INSERT. DELETE y UPDATE están
-- NEGADOS a nivel de base de datos por trigger (pared sin puerta),
-- para todos los roles, incluido el admin/dueño y service_role.
-- ───────────────────────────────────────────────────────────────

-- ── EMPLEADOS (extiende profiles de la Tanda 1) ────────────────
alter table public.profiles add column if not exists cedula     text;
alter table public.profiles add column if not exists telefono   text;
alter table public.profiles add column if not exists cargo      text;
alter table public.profiles add column if not exists turno      text;
alter table public.profiles add column if not exists rol        text not null default 'cajero';
alter table public.profiles add column if not exists activo     boolean not null default true;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_rol_check') then
    alter table public.profiles add constraint profiles_rol_check
      check (rol in ('dueno','admin','farmaceutico','cajero','motorista'));
  end if;
end $$;

-- La cuenta demo es la dueña.
update public.profiles
  set rol = 'dueno', cargo = coalesce(cargo,'Propietaria'),
      full_name = coalesce(full_name, 'Propietaria (Demo)')
  where username = 'demo';

-- handle_new_user: respeta rol/cargo/etc. del metadata si vienen.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, rol, cedula, telefono, cargo, turno)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'rol', 'cajero'),
    new.raw_user_meta_data ->> 'cedula',
    new.raw_user_meta_data ->> 'telefono',
    new.raw_user_meta_data ->> 'cargo',
    new.raw_user_meta_data ->> 'turno'
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- ── HISTORIAL DE ACTIVIDAD (inviolable) ────────────────────────
create table if not exists public.actividad (
  id              uuid primary key default gen_random_uuid(),
  empleado_id     uuid references auth.users (id) on delete set null,
  empleado_nombre text,
  rol             text,
  tipo            text not null,
  descripcion     text not null,
  detalle         jsonb not null default '{}'::jsonb,
  ref_tabla       text,
  ref_id          uuid,
  created_at      timestamptz not null default now()
);
create index if not exists actividad_created_idx on public.actividad (created_at desc);
create index if not exists actividad_empleado_idx on public.actividad (empleado_id, created_at desc);
create index if not exists actividad_tipo_idx on public.actividad (tipo);

comment on table public.actividad is 'Historial permanente e inviolable. Solo INSERT; DELETE/UPDATE negados en base.';

-- Seguridad: RLS + FORCE. Solo SELECT e INSERT para autenticados.
alter table public.actividad enable row level security;
alter table public.actividad force row level security;
drop policy if exists actividad_select on public.actividad;
create policy actividad_select on public.actividad for select to authenticated using (true);
drop policy if exists actividad_insert on public.actividad;
create policy actividad_insert on public.actividad for insert to authenticated with check (true);
-- Sin políticas de UPDATE/DELETE => negadas por RLS para anon/authenticated.

-- PARED SIN PUERTA: niega UPDATE/DELETE/TRUNCATE a TODOS (incluye service_role
-- y dueño de la tabla; los triggers se disparan aunque se ignore la RLS).
revoke update, delete on public.actividad from authenticated, anon, public;

create or replace function public.actividad_inmutable()
returns trigger language plpgsql as $$
begin
  raise exception 'El historial de actividad es inviolable: la operación % no está permitida.', tg_op
    using errcode = 'insufficient_privilege';
end $$;

drop trigger if exists trg_actividad_no_update on public.actividad;
create trigger trg_actividad_no_update before update on public.actividad
  for each row execute function public.actividad_inmutable();
drop trigger if exists trg_actividad_no_delete on public.actividad;
create trigger trg_actividad_no_delete before delete on public.actividad
  for each row execute function public.actividad_inmutable();
drop trigger if exists trg_actividad_no_truncate on public.actividad;
create trigger trg_actividad_no_truncate before truncate on public.actividad
  for each statement execute function public.actividad_inmutable();

-- ── Funciones para registrar actividad ─────────────────────────
create or replace function public.log_actividad(
  p_actor uuid, p_tipo text, p_desc text,
  p_detalle jsonb default '{}'::jsonb, p_ref_tabla text default null, p_ref_id uuid default null
) returns void language plpgsql security definer set search_path = public as $$
declare v_nombre text; v_rol text;
begin
  select coalesce(full_name, username), rol into v_nombre, v_rol from public.profiles where id = p_actor;
  insert into public.actividad (empleado_id, empleado_nombre, rol, tipo, descripcion, detalle, ref_tabla, ref_id)
  values (p_actor, coalesce(v_nombre,'Sistema'), v_rol, p_tipo, p_desc, coalesce(p_detalle,'{}'::jsonb), p_ref_tabla, p_ref_id);
end $$;

-- Wrapper para el app (actor = usuario autenticado).
create or replace function public.registrar_actividad(
  p_tipo text, p_desc text, p_detalle jsonb default '{}'::jsonb,
  p_ref_tabla text default null, p_ref_id uuid default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  perform public.log_actividad(auth.uid(), p_tipo, p_desc, p_detalle, p_ref_tabla, p_ref_id);
end $$;

-- ── Triggers que LEEN los eventos existentes (fuente única) ─────
-- Ventas (Tanda 4)
create or replace function public.trg_log_venta() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.estado = 'completada' then
    perform public.log_actividad(new.empleado_id, 'venta',
      'Venta #' || new.folio || ' por ' || to_char(new.total,'FM999G999G990D00'),
      jsonb_build_object('folio',new.folio,'total',new.total,'metodo',new.metodo_pago), 'ventas', new.id);
  elsif tg_op = 'UPDATE' and new.estado = 'anulada' and coalesce(old.estado,'') <> 'anulada' then
    perform public.log_actividad(new.anulada_por, 'venta_anulada',
      'Anulación de venta #' || new.folio,
      jsonb_build_object('folio',new.folio,'motivo',new.motivo_anulacion,'total',new.total), 'ventas', new.id);
  end if;
  return new;
end $$;
drop trigger if exists trg_actividad_venta on public.ventas;
create trigger trg_actividad_venta after insert or update on public.ventas
  for each row execute function public.trg_log_venta();

-- Caja (Tanda 4)
create or replace function public.trg_log_caja() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_actividad(new.abierta_por, 'caja_apertura', 'Apertura de caja',
      jsonb_build_object('monto_inicial',new.monto_inicial), 'cajas', new.id);
  elsif tg_op = 'UPDATE' and new.estado = 'cerrada' and coalesce(old.estado,'') <> 'cerrada' then
    perform public.log_actividad(new.cerrada_por, 'caja_cierre', 'Cierre de caja',
      jsonb_build_object('contado',new.monto_contado,'diferencia',new.diferencia), 'cajas', new.id);
  end if;
  return new;
end $$;
drop trigger if exists trg_actividad_caja on public.cajas;
create trigger trg_actividad_caja after insert or update on public.cajas
  for each row execute function public.trg_log_caja();

-- Movimientos de inventario (Tandas 3-4): solo entradas y ajustes manuales
create or replace function public.trg_log_movimiento() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.tipo = 'entrada' then
    perform public.log_actividad(new.usuario_id, 'entrada_mercancia', 'Entrada de mercancía',
      jsonb_build_object('cantidad',new.cantidad,'motivo',new.motivo), 'movimientos_inventario', new.id);
  elsif new.tipo = 'ajuste' and coalesce(new.motivo,'') not like 'Anulación%' then
    perform public.log_actividad(new.usuario_id, 'ajuste_inventario', 'Ajuste de inventario',
      jsonb_build_object('cantidad',new.cantidad,'motivo',new.motivo), 'movimientos_inventario', new.id);
  end if;
  return new;
end $$;
drop trigger if exists trg_actividad_movimiento on public.movimientos_inventario;
create trigger trg_actividad_movimiento after insert on public.movimientos_inventario
  for each row execute function public.trg_log_movimiento();

-- Cambios de precio en productos
create or replace function public.trg_log_precio() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.precio_venta is distinct from old.precio_venta or new.precio_costo is distinct from old.precio_costo then
    perform public.log_actividad(auth.uid(), 'cambio_precio', 'Cambio de precio: ' || new.nombre_comercial,
      jsonb_build_object('antes_costo',old.precio_costo,'ahora_costo',new.precio_costo,
                         'antes_venta',old.precio_venta,'ahora_venta',new.precio_venta), 'productos', new.id);
  end if;
  return new;
end $$;
drop trigger if exists trg_actividad_precio on public.productos;
create trigger trg_actividad_precio after update on public.productos
  for each row execute function public.trg_log_precio();

grant execute on function public.registrar_actividad(text, text, jsonb, text, uuid) to authenticated;
