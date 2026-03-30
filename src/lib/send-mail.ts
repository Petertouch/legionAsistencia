// Client-side helper para enviar emails desde el admin
// Usa las plantillas del mail store

import { useMailStore } from "./stores/mail-store";

interface SendMailParams {
  slug: string;
  to: string;
  variables: Record<string, string>;
}

export async function triggerMail({ slug, to, variables }: SendMailParams): Promise<boolean> {
  // Leer plantilla del store
  const template = useMailStore.getState().getBySlug(slug);

  if (!template) {
    console.warn(`[MAIL] Template "${slug}" no encontrado`);
    return false;
  }

  if (!template.activo) {
    console.log(`[MAIL] Template "${slug}" está inactivo, no se envía`);
    return false;
  }

  if (!to) {
    console.warn(`[MAIL] No hay destinatario para "${slug}"`);
    return false;
  }

  try {
    const res = await fetch("/api/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        slug,
        subject: template.asunto,
        html: template.cuerpo,
        variables,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`[MAIL] Error enviando "${slug}":`, err);
      return false;
    }

    console.log(`[MAIL] ✓ "${slug}" enviado a ${to}`);
    return true;
  } catch (err) {
    console.error(`[MAIL] Error enviando "${slug}":`, err);
    return false;
  }
}
