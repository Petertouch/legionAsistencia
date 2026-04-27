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

// Reemplaza {{variables}} en el template
export function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
