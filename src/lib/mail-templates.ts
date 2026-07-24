// ─────────────────────────────────────────────────────────────
// Capa de servidor de las plantillas de email.
//
// Fuente de verdad del CONTENIDO: tabla `mail_templates` en Supabase
// (guarda overrides de asunto/cuerpo/activo por slug). La estructura
// (nombre, categoría, variables) vive en SEED_TEMPLATES, que además
// es el fallback si la BD falla → un correo nunca se cae.
// ─────────────────────────────────────────────────────────────
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail, renderTemplate } from "@/lib/mail";
import { SEED_TEMPLATES, type MailTemplate } from "@/lib/mail-templates-data";

const TABLE = "mail_templates";

interface TemplateOverride {
  slug: string;
  asunto: string;
  cuerpo: string;
  activo: boolean;
}

function mergeOverride(base: MailTemplate, o?: Partial<TemplateOverride> | null): MailTemplate {
  if (!o) return base;
  return {
    ...base,
    asunto: o.asunto ?? base.asunto,
    cuerpo: o.cuerpo ?? base.cuerpo,
    activo: typeof o.activo === "boolean" ? o.activo : base.activo,
  };
}

/** Devuelve todas las plantillas (semilla + overrides de BD). Nunca lanza. */
export async function getAllTemplates(): Promise<MailTemplate[]> {
  let rows: TemplateOverride[] = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from(TABLE).select("slug, asunto, cuerpo, activo");
    rows = (data as TemplateOverride[]) || [];
  } catch {
    // Sin tabla / sin conexión → solo semilla
  }
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return SEED_TEMPLATES.map((t) => mergeOverride(t, bySlug.get(t.slug)));
}

/** Devuelve una plantilla por slug (semilla + override). null si el slug no existe en la semilla. */
export async function getTemplate(slug: string): Promise<MailTemplate | null> {
  const base = SEED_TEMPLATES.find((t) => t.slug === slug);
  if (!base) return null;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from(TABLE)
      .select("slug, asunto, cuerpo, activo")
      .eq("slug", slug)
      .maybeSingle();
    return mergeOverride(base, data as TemplateOverride | null);
  } catch {
    return base;
  }
}

/** Guarda un override editable. Solo se permiten slugs que existan en la semilla. */
export async function updateTemplate(
  slug: string,
  patch: { asunto?: string; cuerpo?: string; activo?: boolean }
): Promise<MailTemplate> {
  const base = SEED_TEMPLATES.find((t) => t.slug === slug);
  if (!base) throw new Error(`Plantilla "${slug}" no existe`);

  // Partimos del efectivo actual para no perder campos al hacer upsert.
  const current = await getTemplate(slug);
  const next: TemplateOverride = {
    slug,
    asunto: patch.asunto ?? current?.asunto ?? base.asunto,
    cuerpo: patch.cuerpo ?? current?.cuerpo ?? base.cuerpo,
    activo: typeof patch.activo === "boolean" ? patch.activo : current?.activo ?? base.activo,
  };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ ...next, updated_at: new Date().toISOString() }, { onConflict: "slug" });
  if (error) throw new Error(error.message);

  return mergeOverride(base, next);
}

interface SendTemplateOptions {
  slug: string;
  to: string;
  variables?: Record<string, string>;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
  /** Envía aunque la plantilla esté marcada como inactiva (para correos críticos). */
  force?: boolean;
}

/**
 * Envía un correo a partir de una plantilla de BD. Renderiza {{variables}}
 * y bloques {{#if}}. Respeta el flag `activo` salvo `force`.
 * Devuelve true si se envió.
 */
export async function sendTemplate({ slug, to, variables = {}, attachments, force }: SendTemplateOptions): Promise<boolean> {
  if (!to) {
    console.warn(`[MAIL] Sin destinatario para "${slug}"`);
    return false;
  }
  const template = await getTemplate(slug);
  if (!template) {
    console.warn(`[MAIL] Plantilla "${slug}" no encontrada`);
    return false;
  }
  if (!template.activo && !force) {
    console.log(`[MAIL] Plantilla "${slug}" inactiva, no se envía`);
    return false;
  }

  const subject = renderTemplate(template.asunto, variables);
  const html = renderTemplate(template.cuerpo, variables);
  await sendMail({ to, subject, html, attachments });
  return true;
}
