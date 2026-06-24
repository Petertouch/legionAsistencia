-- ════════════════════════════════════════════════════════════════
-- Tabla `equipo` — fuente única de abogados y profesores
-- Reemplaza el store de Zustand (localStorage) por datos compartidos.
-- Ejecutar en Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.equipo (
  id                     uuid primary key default gen_random_uuid(),
  role                   text not null default 'abogado',  -- 'abogado' | 'profesor'
  nombre                 text not null,
  email                  text unique not null,
  telefono               text default '',
  cedula                 text default '',
  estado                 text not null default 'activo',    -- 'activo' | 'inactivo' | 'vacaciones'
  fecha_ingreso          date,
  password               text default '',
  color                  text default '#3b82f6',
  notas                  text default '',
  -- Abogado
  areas_habilitadas      jsonb default '[]'::jsonb,
  especialidad           text default '',
  max_casos              int default 0,
  -- Profesor
  especialidad_academica text default '',
  bio                    text default '',
  avatar_url             text default '',
  -- Vendedor
  comision_porcentaje    numeric default 0,
  vendedor_code          text default '',
  ciudad                 text default '',
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- Solo el service_role (usado por las rutas API del servidor) puede acceder.
alter table public.equipo enable row level security;

-- Datos iniciales (equivalentes a los que traía el código por defecto).
insert into public.equipo
  (role, nombre, email, telefono, cedula, estado, fecha_ingreso,
   areas_habilitadas, especialidad, max_casos,
   especialidad_academica, bio, color, notas)
values
  ('abogado', 'Dr. Ramirez', 'ramirez@legionjuridica.com', '3176689010', '80123456',
   'activo', '2024-06-01',
   '["Disciplinario","Penal Militar","Consumidor"]'::jsonb, 'Penal Militar', 15,
   '', '', '#3b82f6', 'Abogado senior. 8 años de experiencia en justicia penal militar.'),
  ('profesor', 'Pedro Tobar', 'pedrotobarcaldas@gmail.com', '3124426783', '1110448098',
   'activo', '2026-03-30',
   '[]'::jsonb, 'Disciplinario', 0,
   'Finanzas personales y educación financiera',
   'Especialista en finanzas personales para servidores públicos', '#a855f7', '')
on conflict (email) do nothing;
