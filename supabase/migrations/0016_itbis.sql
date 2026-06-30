-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — ITBIS realista (con exentos)
-- En RD el ITBIS es 18%. Los MEDICAMENTOS suelen estar EXENTOS; los
-- no-medicamentos (cosméticos, higiene, vitaminas, etc.) GRAVADOS.
-- El impuesto se calcula SOLO sobre los productos gravados del carrito.
-- Todo el cálculo ocurre en el SERVIDOR (este RPC), no en el navegador.
-- ⚠️ Simulado para demostración. El tratamiento fiscal real (exenciones,
-- tasas, NCF/DGII) se configura y verifica en producción.
-- ───────────────────────────────────────────────────────────────

-- ── 1) Atributo por producto: ¿gravado con ITBIS (18%) o exento? ──
-- Default false = EXENTO (los medicamentos, mayoría del catálogo).
alter table public.productos
  add column if not exists itbis_gravado boolean not null default false;

-- Siembra realista: las categorías no-medicamento quedan GRAVADAS.
-- (El dueño puede cambiarlo por producto desde el formulario.)
update public.productos
   set itbis_gravado = true
 where categoria in ('Vitaminas', 'Dermatológicos', 'Otros');

-- ── 2) Recrear la vista para exponer la columna nueva (p.* se expande
--       al CREAR la vista; sin recrearla, itbis_gravado no aparecería). ──
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
grant select on public.productos_con_stock to authenticated;

-- ── 3) Guardar el ITBIS en la venta (y por línea, para el recibo/historial) ──
alter table public.ventas       add column if not exists itbis   numeric(12,2) not null default 0;
alter table public.venta_items  add column if not exists itbis   numeric(12,2) not null default 0;
alter table public.venta_items  add column if not exists gravado boolean       not null default false;

-- ── 4) Recrear registrar_venta: ITBIS server-side sobre los gravados ──
-- subtotal = Σ líneas; el descuento global se prorratea sobre la base gravable
-- (no se cobra impuesto sobre lo descontado). total = subtotal − descuento + ITBIS.
create or replace function public.registrar_venta(
  p_items jsonb,
  p_metodo text,
  p_descuento numeric default 0,
  p_monto_recibido numeric default null,
  p_voucher text default null,
  p_receta jsonb default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_caja uuid;
  v_sub numeric := 0;
  v_base_grav numeric := 0;
  v_desc numeric := 0;
  v_factor numeric := 1;
  v_itbis numeric := 0;
  v_total numeric;
  v_cambio numeric := 0;
  v_venta uuid;
  v_folio bigint;
  it jsonb;
  v_pid uuid; v_cant int; v_precio numeric; v_ldesc numeric; v_line numeric;
  v_unid int; v_rem int; v_take int; v_nombre text; v_usados jsonb; v_emp text; v_pres text;
  v_grav boolean; v_line_itbis numeric;
  lote record;
begin
  if v_uid is null then raise exception 'No autorizado'; end if;
  select username into v_emp from public.profiles where id = v_uid;
  if jsonb_array_length(coalesce(p_items,'[]'::jsonb)) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  select id into v_caja from public.cajas where estado = 'abierta' order by abierta_at desc limit 1;
  if v_caja is null then raise exception 'Debes abrir la caja antes de vender'; end if;

  -- Subtotal + base gravable (sin tocar stock todavía).
  -- El flag de ITBIS se lee de la BD (productos.itbis_gravado): no se confía
  -- en lo que mande el navegador, así el total no se puede manipular.
  for it in select * from jsonb_array_elements(p_items) loop
    v_line := (it->>'cantidad')::int * (it->>'precio_unitario')::numeric
              - coalesce((it->>'descuento')::numeric, 0);
    v_sub := v_sub + v_line;
    select itbis_gravado into v_grav from public.productos where id = (it->>'producto_id')::uuid;
    if coalesce(v_grav, false) then
      v_base_grav := v_base_grav + v_line;
    end if;
  end loop;

  -- Descuento global prorrateado sobre la base gravable.
  v_desc := least(greatest(coalesce(p_descuento, 0), 0), v_sub);
  v_factor := case when v_sub > 0 then (v_sub - v_desc) / v_sub else 1 end;
  v_itbis := round(v_base_grav * v_factor * 0.18, 2);
  v_total := round(greatest(v_sub - v_desc, 0) + v_itbis, 2);

  if p_metodo = 'efectivo' then
    if coalesce(p_monto_recibido, 0) < v_total then
      raise exception 'El monto recibido es menor que el total';
    end if;
    v_cambio := coalesce(p_monto_recibido, 0) - v_total;
  end if;

  insert into public.ventas
    (caja_id, subtotal, descuento, itbis, total, metodo_pago, monto_recibido, cambio, voucher,
     receta_medico, receta_paciente, receta_numero, empleado_id, empleado_nombre)
  values
    (v_caja, v_sub, v_desc, v_itbis, v_total, p_metodo, p_monto_recibido, v_cambio, p_voucher,
     p_receta->>'medico', p_receta->>'paciente', p_receta->>'numero', v_uid, v_emp)
  returning id, folio into v_venta, v_folio;

  -- Descuento de stock por FEFO + items (en UNIDADES).
  for it in select * from jsonb_array_elements(p_items) loop
    v_pid := (it->>'producto_id')::uuid;
    v_cant := (it->>'cantidad')::int;
    v_precio := (it->>'precio_unitario')::numeric;
    v_ldesc := coalesce((it->>'descuento')::numeric, 0);
    v_pres := it->>'presentacion';
    v_unid := coalesce((it->>'unidades')::int, v_cant);  -- unidades reales a descontar
    v_line := v_cant * v_precio - v_ldesc;
    v_rem := v_unid;
    v_usados := '[]'::jsonb;

    select itbis_gravado into v_grav from public.productos where id = v_pid;
    v_grav := coalesce(v_grav, false);
    v_line_itbis := case when v_grav then round(v_line * v_factor * 0.18, 2) else 0 end;

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
      (venta_id, producto_id, nombre_producto, cantidad, precio_unitario, descuento, subtotal, lotes_usados, presentacion, itbis, gravado)
    values (v_venta, v_pid, coalesce(v_nombre,'Producto'), v_cant, v_precio, v_ldesc, v_line, v_usados, v_pres, v_line_itbis, v_grav);
  end loop;

  return jsonb_build_object(
    'venta_id', v_venta, 'folio', v_folio,
    'subtotal', v_sub, 'descuento', v_desc, 'itbis', v_itbis,
    'total', v_total, 'cambio', v_cambio);
end $$;

grant execute on function public.registrar_venta(jsonb, text, numeric, numeric, text, jsonb) to authenticated;
