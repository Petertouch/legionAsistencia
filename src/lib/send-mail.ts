// Helper de cliente para disparar emails desde el admin.
// El cuerpo/asunto/activo los resuelve el SERVIDOR desde la BD
// (tabla mail_templates) — aquí solo se manda slug + variables.

interface SendMailParams {
  slug: string;
  to: string;
  variables: Record<string, string>;
}

export async function triggerMail({ slug, to, variables }: SendMailParams): Promise<boolean> {
  if (!to) {
    console.warn(`[MAIL] No hay destinatario para "${slug}"`);
    return false;
  }
  try {
    const res = await fetch("/api/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, to, variables }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`[MAIL] Error enviando "${slug}":`, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[MAIL] Error enviando "${slug}":`, err);
    return false;
  }
}
