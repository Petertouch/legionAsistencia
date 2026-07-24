-- Plantillas de email editables desde /admin/mails.
-- Guarda solo el contenido editable (asunto/cuerpo/activo) por slug.
-- La estructura (nombre, categoría, variables) vive en el código
-- (src/lib/mail-templates-data.ts), que además es el fallback si la BD falla.
--
-- Correr una sola vez en el SQL Editor de Supabase.

create table if not exists mail_templates (
  slug        text primary key,
  asunto      text not null,
  cuerpo      text not null,
  activo      boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- Solo el backend (service_role) puede leer/escribir. anon/auth quedan bloqueados.
alter table mail_templates enable row level security;
