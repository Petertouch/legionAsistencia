-- ════════════════════════════════════════════════════════════════
-- Tabla `mensajes` — chat por caso entre cliente y abogado
-- El admin puede ver pero no escribir (se controla en la API).
-- Ejecutar en Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.mensajes (
  id          uuid primary key default gen_random_uuid(),
  caso_id     uuid not null,
  autor_tipo  text not null,   -- 'cliente' | 'abogado'
  autor_id    text,            -- suscriptor.id o equipo.id
  autor_nombre text,
  contenido   text not null,
  created_at  timestamptz default now()
);

alter table public.mensajes enable row level security;

create index if not exists mensajes_caso_idx on public.mensajes (caso_id, created_at asc);
