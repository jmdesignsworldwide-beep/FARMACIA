-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA: ACCESO TEMPORAL DE DEMO (Capa B — JM Designs)
-- Capa de control comercial de JM Designs, INDEPENDIENTE de los roles
-- internos de la farmacia (Capa A, profiles.rol — NO se toca aquí).
--
-- La dueña (admin del demo) crea cuentas de cliente con vigencia. Al
-- vencerse, el servidor bloquea el acceso. Anti-escalada de privilegios:
-- la tabla SOLO se escribe con service_role (vía server actions guardadas);
-- un cliente no puede auto-extenderse ni promoverse a admin.
-- ───────────────────────────────────────────────────────────────

create table if not exists public.demo_accesos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users (id) on delete cascade,
  username      text not null,
  es_admin_demo boolean not null default false,  -- true = JM Designs (controla el demo)
  vence_at      timestamptz,                      -- null = sin vencimiento (nunca expira)
  dias_otorgados int,                             -- vigencia elegida (para mostrar)
  activo        boolean not null default true,
  notas         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.demo_accesos is
  'Acceso temporal de demo (Capa B, JM Designs). Solo escribible por service_role.';

create index if not exists demo_accesos_vence_idx on public.demo_accesos (vence_at);

-- ----- Seguridad: RLS + FORCE -----
alter table public.demo_accesos enable row level security;
alter table public.demo_accesos force row level security;

-- Un usuario solo puede LEER su propia fila (para ver su estado). Nadie puede
-- INSERT/UPDATE/DELETE como authenticated/anon: sin esas políticas quedan negadas,
-- por lo que toda escritura ocurre únicamente con service_role desde el servidor.
drop policy if exists demo_acceso_propio_select on public.demo_accesos;
create policy demo_acceso_propio_select
  on public.demo_accesos for select
  to authenticated
  using (auth.uid() = user_id);

-- Cinturón y tirantes: revoca explícitamente la escritura a clientes.
revoke insert, update, delete on public.demo_accesos from authenticated, anon, public;

-- ----- Mantener updated_at -----
drop trigger if exists trg_demo_accesos_updated_at on public.demo_accesos;
create trigger trg_demo_accesos_updated_at
  before update on public.demo_accesos
  for each row execute function public.set_updated_at();

-- ----- Validación de vigencia (SECURITY DEFINER) -----
-- Devuelve el estado de acceso del usuario ACTUAL (auth.uid()), sin exponer
-- las filas de otros. La app lo usa para decidir si deja entrar o no.
create or replace function public.mi_acceso_demo()
returns table (es_admin_demo boolean, vence_at timestamptz, activo boolean, vigente boolean)
language sql
security definer
set search_path = public
as $$
  select d.es_admin_demo,
         d.vence_at,
         d.activo,
         (d.activo and (d.vence_at is null or d.vence_at > now())) as vigente
  from public.demo_accesos d
  where d.user_id = auth.uid();
$$;

grant execute on function public.mi_acceso_demo() to authenticated;

-- ----- Semilla: una fila por cada usuario existente -----
-- La cuenta 'demo' es la admin de JM Designs; el resto queda SIN vencimiento
-- (el personal interno de la farmacia no debe expirar).
insert into public.demo_accesos (user_id, username, es_admin_demo, vence_at, activo)
select p.id, p.username, (p.username = 'demo'), null, true
from public.profiles p
on conflict (user_id) do nothing;
