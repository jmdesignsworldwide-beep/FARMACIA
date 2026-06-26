-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA 3: Productos + Inventario (núcleo real)
-- Stock por LOTE. El stock total de un producto se LEE sumando sus
-- lotes (fuente única, sin campo duplicado desincronizable).
-- Seguridad: RLS + FORCE en todas las tablas. Acceso a usuarios
-- autenticados (demo de una sola farmacia); el gate de auth protege.
-- ───────────────────────────────────────────────────────────────

-- ── PRODUCTOS / MEDICAMENTOS ───────────────────────────────────
create table if not exists public.productos (
  id                uuid primary key default gen_random_uuid(),
  nombre_comercial  text not null,
  nombre_generico   text not null,
  laboratorio       text,
  concentracion     text,                 -- ej. "500 mg"
  presentacion      text,                 -- ej. "Caja 20 tabletas"
  categoria         text not null default 'Otros',
  codigo_barras     text,
  precio_costo      numeric(12,2) not null default 0 check (precio_costo >= 0),
  precio_venta      numeric(12,2) not null default 0 check (precio_venta >= 0),
  -- Margen % calculado en la BD (fuente única, no editable):
  margen_pct        numeric(6,2) generated always as (
                      case when precio_costo > 0
                           then round(((precio_venta - precio_costo) / precio_costo) * 100, 2)
                           else 0 end
                    ) stored,
  controlado        boolean not null default false,
  requiere_receta   boolean not null default false,
  stock_minimo      integer not null default 0 check (stock_minimo >= 0),
  activo            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Código de barras único cuando está presente.
create unique index if not exists productos_codigo_barras_key
  on public.productos (codigo_barras) where codigo_barras is not null;
create index if not exists productos_categoria_idx on public.productos (categoria);
create index if not exists productos_nombre_idx on public.productos (nombre_comercial, nombre_generico);

comment on table public.productos is 'Catálogo de medicamentos/productos de JM Farmacia.';

-- ── LOTES (stock real) ─────────────────────────────────────────
create table if not exists public.lotes (
  id                  uuid primary key default gen_random_uuid(),
  producto_id         uuid not null references public.productos (id) on delete cascade,
  numero_lote         text not null,
  cantidad            integer not null default 0 check (cantidad >= 0),
  fecha_vencimiento   date not null,
  proveedor           text,
  fecha_entrada       date not null default current_date,
  created_at          timestamptz not null default now(),
  unique (producto_id, numero_lote)
);
create index if not exists lotes_producto_idx on public.lotes (producto_id);
create index if not exists lotes_vencimiento_idx on public.lotes (fecha_vencimiento);

comment on table public.lotes is 'Lotes por producto: cantidad y vencimiento. El stock total = suma de lotes.';

-- ── MOVIMIENTOS DE INVENTARIO ──────────────────────────────────
create table if not exists public.movimientos_inventario (
  id            uuid primary key default gen_random_uuid(),
  producto_id   uuid not null references public.productos (id) on delete cascade,
  lote_id       uuid references public.lotes (id) on delete set null,
  tipo          text not null check (tipo in ('entrada','salida','ajuste')),
  cantidad      integer not null,          -- positivo entrada/ajuste+, negativo salida/ajuste-
  motivo        text,
  usuario_id    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists movimientos_producto_idx on public.movimientos_inventario (producto_id, created_at desc);

comment on table public.movimientos_inventario is 'Historial de entradas/salidas/ajustes. El POS (Tanda 4) insertará salidas aquí.';

-- ── updated_at en productos ────────────────────────────────────
drop trigger if exists trg_productos_updated_at on public.productos;
create trigger trg_productos_updated_at
  before update on public.productos
  for each row execute function public.set_updated_at();

-- ── VISTA: productos con stock (fuente única de lectura) ────────
-- security_invoker => respeta el RLS de quien consulta.
drop view if exists public.productos_con_stock;
create view public.productos_con_stock
  with (security_invoker = true) as
select
  p.*,
  coalesce(s.stock_total, 0)  as stock_total,
  coalesce(s.lotes_count, 0)  as lotes_count,
  s.proximo_vencimiento,
  (coalesce(s.stock_total, 0) <= p.stock_minimo) as bajo_stock
from public.productos p
left join (
  select producto_id,
         sum(cantidad)            as stock_total,
         count(*)                 as lotes_count,
         min(fecha_vencimiento)   as proximo_vencimiento
  from public.lotes
  group by producto_id
) s on s.producto_id = p.id;

comment on view public.productos_con_stock is 'Productos con stock total calculado (suma de lotes).';

-- ── SEGURIDAD: RLS + FORCE + políticas (autenticados) ──────────
do $$
declare t text;
begin
  foreach t in array array['productos','lotes','movimientos_inventario'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format('drop policy if exists "%s_auth_all" on public.%I;', t, t);
    execute format(
      'create policy "%s_auth_all" on public.%I for all to authenticated using (true) with check (true);',
      t, t);
  end loop;
end $$;

-- ── FUNCIÓN: registrar entrada de mercancía (atómica) ──────────
-- Inserta/crea el lote y registra el movimiento 'entrada' en una sola
-- transacción. Si el lote (producto+numero_lote) existe, suma la cantidad.
create or replace function public.registrar_entrada_mercancia(
  p_producto_id uuid,
  p_numero_lote text,
  p_cantidad integer,
  p_vencimiento date,
  p_proveedor text default null,
  p_fecha_entrada date default current_date
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lote_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'No autorizado';
  end if;
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero';
  end if;

  insert into public.lotes (producto_id, numero_lote, cantidad, fecha_vencimiento, proveedor, fecha_entrada)
  values (p_producto_id, p_numero_lote, p_cantidad, p_vencimiento, p_proveedor, coalesce(p_fecha_entrada, current_date))
  on conflict (producto_id, numero_lote)
    do update set cantidad = public.lotes.cantidad + excluded.cantidad,
                  proveedor = coalesce(excluded.proveedor, public.lotes.proveedor)
  returning id into v_lote_id;

  insert into public.movimientos_inventario (producto_id, lote_id, tipo, cantidad, motivo, usuario_id)
  values (p_producto_id, v_lote_id, 'entrada', p_cantidad, 'Entrada de mercancía', v_uid);

  return v_lote_id;
end $$;

-- ── FUNCIÓN: ajuste de stock de un lote (atómico) ──────────────
create or replace function public.registrar_ajuste_lote(
  p_lote_id uuid,
  p_nueva_cantidad integer,
  p_motivo text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_producto_id uuid;
  v_actual integer;
  v_delta integer;
begin
  if v_uid is null then
    raise exception 'No autorizado';
  end if;
  if p_nueva_cantidad is null or p_nueva_cantidad < 0 then
    raise exception 'La cantidad no puede ser negativa';
  end if;

  select producto_id, cantidad into v_producto_id, v_actual
  from public.lotes where id = p_lote_id for update;

  if v_producto_id is null then
    raise exception 'Lote no encontrado';
  end if;

  v_delta := p_nueva_cantidad - v_actual;

  update public.lotes set cantidad = p_nueva_cantidad where id = p_lote_id;

  insert into public.movimientos_inventario (producto_id, lote_id, tipo, cantidad, motivo, usuario_id)
  values (v_producto_id, p_lote_id, 'ajuste', v_delta, coalesce(p_motivo, 'Ajuste de inventario'), v_uid);
end $$;

-- ── Grants para el rol autenticado (la RLS sigue gobernando el acceso) ──
grant select, insert, update, delete
  on public.productos, public.lotes, public.movimientos_inventario
  to authenticated;
grant select on public.productos_con_stock to authenticated;
grant execute on function public.registrar_entrada_mercancia(uuid, text, integer, date, text, date) to authenticated;
grant execute on function public.registrar_ajuste_lote(uuid, integer, text) to authenticated;
