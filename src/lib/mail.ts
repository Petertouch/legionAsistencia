import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Legión Jurídica <noreply@legionjuridica.com>";

interface Attachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}

export async function sendMail({ to, subject, html, attachments }: SendMailOptions) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      content_type: a.contentType || "application/pdf",
    })),
  });

  if (error) {
    console.error("[MAIL ERROR]", error);
    throw new Error(error.message);
  }

  return data;
}

// Reemplaza {{variables}} y bloques condicionales {{#if var}}...{{/if}} en el template.
// - {{#if var}}...{{/if}} → renderiza el contenido solo si `var` tiene valor no vacío.
// - {{var}} → reemplaza por el valor (o "" si no existe).
// - Cualquier {{token}} sobrante se elimina para no filtrar placeholders en el correo.
export function renderTemplate(template: string, variables: Record<string, string>): string {
  const val = (k: string) => (variables[k] ?? "").toString();

  // 1) Bloques condicionales
  let result = template.replace(
    /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_m, key: string, inner: string) => (val(key).trim() !== "" ? inner : "")
  );

  // 2) Variables simples
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, (value ?? "").toString());
  }

  // 3) Limpiar tokens sobrantes ({{algo}} no provisto)
  result = result.replace(/\{\{[\w.]+\}\}/g, "");

  return result;
}
