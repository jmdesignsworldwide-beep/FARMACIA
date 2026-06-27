-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — Eliminar cuentas de cliente (Acceso temporal, Capa B)
-- Dos garantías a nivel de BASE (defensa en profundidad):
--  1) La cuenta ADMIN del demo NO se puede eliminar (ni por cascada).
--  2) Borrar la cuenta de auth desvincula al actor del historial
--     (empleado_id → NULL) SIN poder editar ni borrar el historial:
--     sigue siendo inviolable; solo se permite ese null por FK.
-- ───────────────────────────────────────────────────────────────

-- ── 1) El admin del demo es indeleble (incluye el intento por cascada) ──
create or replace function public.demo_admin_no_borrar()
returns trigger language plpgsql as $$
begin
  if old.es_admin_demo then
    raise exception 'La cuenta de administrador del demo no se puede eliminar.'
      using errcode = 'insufficient_privilege';
  end if;
  return old;
end $$;

drop trigger if exists trg_demo_admin_no_borrar on public.demo_accesos;
create trigger trg_demo_admin_no_borrar
  before delete on public.demo_accesos
  for each row execute function public.demo_admin_no_borrar();

-- ── 2) Historial inviolable, pero permite la desvinculación del actor ──
-- Antes: cualquier UPDATE lanzaba excepción (bloqueaba incluso el FK
-- ON DELETE SET NULL al borrar una cuenta). Ahora se permite ÚNICAMENTE
-- que empleado_id pase a NULL sin que cambie ningún otro dato. El nombre
-- del actor (empleado_nombre) queda intacto, así que el registro se sigue
-- leyendo igual. DELETE y TRUNCATE siguen totalmente prohibidos.
create or replace function public.actividad_inmutable()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE'
     and old.empleado_id is not null
     and new.empleado_id is null
     and new.empleado_nombre is not distinct from old.empleado_nombre
     and new.rol             is not distinct from old.rol
     and new.tipo            is not distinct from old.tipo
     and new.descripcion     is not distinct from old.descripcion
     and new.detalle         is not distinct from old.detalle
     and new.ref_tabla       is not distinct from old.ref_tabla
     and new.ref_id          is not distinct from old.ref_id
     and new.created_at      is not distinct from old.created_at then
    return new; -- desvinculación del actor por borrado de su cuenta (permitido)
  end if;
  raise exception 'El historial de actividad es inviolable: la operación % no está permitida.', tg_op
    using errcode = 'insufficient_privilege';
end $$;
