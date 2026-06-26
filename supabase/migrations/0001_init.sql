-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — Esquema inicial (TANDA 1: cimientos)
-- Seguridad desde el inicio: RLS + FORCE en todas las tablas.
-- ───────────────────────────────────────────────────────────────

-- Perfiles de usuario. El "usuario visible" se guarda aquí; el email
-- interno vive en auth.users (el cliente nunca lo ve).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique,
  full_name   text,
  role        text not null default 'staff',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada usuario del sistema JM Farmacia.';

-- ----- Seguridad: RLS + FORCE -----
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- Cada usuaria solo ve y edita su propio perfil.
drop policy if exists "perfil_propio_select" on public.profiles;
create policy "perfil_propio_select"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "perfil_propio_update" on public.profiles;
create policy "perfil_propio_update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----- Mantener updated_at -----
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----- Crear perfil automáticamente al registrar un usuario -----
-- Toma el "username" del metadata o de la parte local del email interno.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
