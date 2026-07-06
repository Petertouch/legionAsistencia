-- ════════════════════════════════════════════════════════════════
-- Columna abogado_id en casos → atribución confiable del abogado
-- (referencia a equipo.id, en vez de depender del nombre en texto).
-- Ejecutar en Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════

alter table public.casos add column if not exists abogado_id uuid;

create index if not exists casos_abogado_id_idx on public.casos (abogado_id);
