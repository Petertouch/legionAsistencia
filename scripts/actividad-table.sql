-- ════════════════════════════════════════════════════════════════
-- Tabla `actividad` — registro de acciones del equipo (audit log)
-- Registra QUIÉN hizo QUÉ en cada caso. El actor viene de la sesión.
-- Ejecutar en Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.actividad (
  id           uuid primary key default gen_random_uuid(),
  actor_id     text,          -- equipo.id (uuid) o 'admin-1' para el admin de entorno
  actor_nombre text,
  actor_role   text,          -- admin | abogado | profesor
  caso_id      uuid,
  tipo         text not null, -- vio_caso, avanzo_etapa, devolvio_etapa, marco_checklist,
                              -- respondio_consulta, subio_documento, reasigno_abogado, agrego_nota
  detalle      text,
  created_at   timestamptz default now()
);

alter table public.actividad enable row level security;

create index if not exists actividad_actor_idx on public.actividad (actor_id, created_at desc);
create index if not exists actividad_caso_idx  on public.actividad (caso_id, created_at desc);
