-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA 7: Clientes (real) + Delivery (navegable)
-- ───────────────────────────────────────────────────────────────

-- ── CLIENTES ───────────────────────────────────────────────────
create table if not exists public.clientes (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  cedula           text,
  telefono         text,
  fecha_nacimiento date,
  alergias         text[] not null default '{}',
  notas            text,
  balance          numeric(12,2) not null default 0,
  frecuente        boolean not null default false,
  empleado_id      uuid references auth.users (id) on delete set null,
  empleado_nombre  text,
  created_at       timestamptz not null default now()
);
create index if not exists clientes_nombre_idx on public.clientes (nombre);

-- Asociar ventas (Tanda 4) a un cliente — fuente única, sin duplicar.
alter table public.ventas add column if not exists cliente_id uuid references public.clientes (id) on delete set null;
alter table public.ventas add column if not exists cliente_nombre text;
create index if not exists ventas_cliente_idx on public.ventas (cliente_id);

-- ── DELIVERIES (navegable) ─────────────────────────────────────
create table if not exists public.deliveries (
  id               uuid primary key default gen_random_uuid(),
  folio            bigint generated always as identity,
  cliente_id       uuid references public.clientes (id) on delete set null,
  cliente_nombre   text not null,
  telefono         text,
  direccion        text not null,
  sector           text,
  detalle          text,
  monto            numeric(12,2) not null default 0,
  metodo_pago      text,
  motorista_id     uuid references auth.users (id) on delete set null,
  motorista_nombre text,
  estado           text not null default 'pendiente' check (estado in ('pendiente','en_camino','entregado','cancelado')),
  notas            text,
  empleado_id      uuid references auth.users (id) on delete set null,
  empleado_nombre  text,
  created_at       timestamptz not null default now(),
  entregado_at     timestamptz
);
create index if not exists deliveries_created_idx on public.deliveries (created_at desc);
create index if not exists deliveries_motorista_idx on public.deliveries (motorista_id);

-- ── Seguridad: RLS + FORCE + políticas (autenticados) ──────────
do $$
declare t text;
begin
  foreach t in array array['clientes','deliveries'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format('drop policy if exists "%s_auth_all" on public.%I;', t, t);
    execute format(
      'create policy "%s_auth_all" on public.%I for all to authenticated using (true) with check (true);',
      t, t);
  end loop;
end $$;

grant select, insert, update, delete on public.clientes, public.deliveries to authenticated;
