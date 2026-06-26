-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA 8: Proveedores (real) + vínculo con lotes
-- ───────────────────────────────────────────────────────────────

create table if not exists public.proveedores (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  tipo             text not null default 'distribuidor' check (tipo in ('laboratorio','distribuidor','importador','otro')),
  telefono         text,
  email            text,
  rnc              text,
  direccion        text,
  notas            text,
  activo           boolean not null default true,
  empleado_nombre  text,
  created_at       timestamptz not null default now()
);
create index if not exists proveedores_nombre_idx on public.proveedores (nombre);

-- Vincular lotes (Tanda 3) al proveedor registrado — fuente única.
alter table public.lotes add column if not exists proveedor_id uuid references public.proveedores (id) on delete set null;
create index if not exists lotes_proveedor_idx on public.lotes (proveedor_id);

-- ── Seguridad: RLS + FORCE + política (autenticados) ───────────
alter table public.proveedores enable row level security;
alter table public.proveedores force row level security;
drop policy if exists "proveedores_auth_all" on public.proveedores;
create policy "proveedores_auth_all" on public.proveedores for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.proveedores to authenticated;
