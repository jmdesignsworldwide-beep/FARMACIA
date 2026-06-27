-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA 10: Configuración (singleton)
-- Datos de la farmacia + alertas que el sistema obedece.
-- ───────────────────────────────────────────────────────────────

create table if not exists public.configuracion (
  id                      int primary key default 1 check (id = 1),
  nombre_farmacia         text not null default 'JM Farmacia',
  logo_url                text,
  rnc                     text,
  direccion               text,
  telefono                text,
  stock_minimo_default    int not null default 10 check (stock_minimo_default >= 0),
  dias_alerta_vencimiento int not null default 30 check (dias_alerta_vencimiento between 1 and 365),
  metodos_pago            jsonb not null default '{"efectivo":true,"transferencia":true,"tarjeta_debito":true,"tarjeta_credito":true}'::jsonb,
  updated_at              timestamptz not null default now(),
  updated_by              text
);

-- Fila única.
insert into public.configuracion (id) values (1) on conflict (id) do nothing;

-- ── Seguridad: RLS + FORCE ─────────────────────────────────────
alter table public.configuracion enable row level security;
alter table public.configuracion force row level security;
-- Todos los autenticados pueden LEER (el header muestra el nombre).
drop policy if exists "config_select" on public.configuracion;
create policy "config_select" on public.configuracion for select to authenticated using (true);
-- Escritura permitida a autenticados (el servidor exige rol dueño/admin).
drop policy if exists "config_write" on public.configuracion;
create policy "config_write" on public.configuracion for update to authenticated using (true) with check (true);

grant select, update on public.configuracion to authenticated;
