-- ════════════════════════════════════════════════════════════════
-- Adjuntos en el chat: archivo (PDF/Word/Excel) por mensaje.
-- Ejecutar en Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════

alter table public.mensajes add column if not exists archivo_url text;
alter table public.mensajes add column if not exists archivo_nombre text;
