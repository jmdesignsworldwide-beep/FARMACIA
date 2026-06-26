-- ───────────────────────────────────────────────────────────────
-- JM Farmacia — TANDA 6: datos de demostración (recetas + libro)
-- ───────────────────────────────────────────────────────────────
do $$
declare
  v_amox uuid; v_losartan uuid; v_tramal uuid; v_rivotril uuid;
  r1 uuid; r2 uuid;
begin
  select id into v_amox    from public.productos where codigo_barras = '7460010012348';
  select id into v_losartan from public.productos where codigo_barras = '7460010012351';
  select id into v_tramal   from public.productos where codigo_barras = '7460010012361';
  select id into v_rivotril from public.productos where codigo_barras = '7460010012362';

  -- Receta NO controlada (registrada)
  if not exists (select 1 from public.recetas where numero = 'RX-2026-0001') then
    insert into public.recetas (numero, medico_nombre, medico_colegiatura, paciente_nombre, paciente_cedula, fecha, controlada, origen, estado, empleado_nombre)
    values ('RX-2026-0001','Dr. Luis Martínez','CMD-12345','Carmen Jiménez','402-1122334-5', current_date - 3, false, 'manual','registrada','María Pérez')
    returning id into r1;
    insert into public.receta_items (receta_id, producto_id, nombre_medicamento, cantidad, controlado, indicaciones) values
      (r1, v_amox, 'Amoxicilina 500 mg', 15, false, '1 cápsula cada 8 horas por 7 días'),
      (r1, v_losartan, 'Losartán 50 mg', 30, false, '1 tableta diaria');
  end if;

  -- Receta controlada (registrada, pendiente de despacho)
  if not exists (select 1 from public.recetas where numero = 'RX-2026-0002') then
    insert into public.recetas (numero, medico_nombre, medico_colegiatura, paciente_nombre, paciente_cedula, fecha, controlada, origen, estado, empleado_nombre)
    values ('RX-2026-0002','Dra. Sofía Reyes','CMD-23456','Rafael Núñez','001-9988776-6', current_date - 1, true, 'manual','registrada','Ana Gómez')
    returning id into r2;
    insert into public.receta_items (receta_id, producto_id, nombre_medicamento, cantidad, controlado, indicaciones) values
      (r2, v_tramal, 'Tramadol 50 mg', 10, true, '1 cápsula cada 12 horas, máximo 5 días');
  end if;

  -- Libro de controlados: despachos ya asentados (para que se vea vivo)
  if not exists (select 1 from public.libro_controlados where numero_receta = 'RX-2026-0098') then
    insert into public.libro_controlados (producto_id, producto_nombre, cantidad, medico_nombre, medico_colegiatura, paciente_nombre, paciente_cedula, numero_receta, empleado_nombre, created_at) values
      (v_tramal,'Tramal (Tramadol 50 mg)', 10, 'Dr. Pedro Holguín','CMD-34567','Juana Díaz','223-4455667-8','RX-2026-0098','María Pérez', now() - interval '2 days'),
      (v_rivotril,'Rivotril (Clonazepam 2 mg)', 30, 'Dra. Sofía Reyes','CMD-23456','Rafael Núñez','001-9988776-6','RX-2026-0099','Ana Gómez', now() - interval '1 day'),
      (v_tramal,'Tramal (Tramadol 50 mg)', 20, 'Dr. Luis Martínez','CMD-12345','José Castillo','402-7788990-1','RX-2026-0100','María Pérez', now() - interval '6 hours');
  end if;
end $$;
