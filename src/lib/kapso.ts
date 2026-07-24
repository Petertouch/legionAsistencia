import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Config ───────────────────────────────────────────────────────
const API_KEY = process.env.KAPSO_API_KEY;
const PHONE_NUMBER_ID = process.env.KAPSO_PHONE_NUMBER_ID;
const BASE = "https://api.kapso.ai/meta/whatsapp/v24.0";
const LANG = process.env.KAPSO_TEMPLATE_LANG || "es";

// Nombres de las plantillas (deben existir y estar APROBADAS en Meta/Kapso).
const TPL_NUEVO_CASO = process.env.KAPSO_TPL_NUEVO_CASO || "nuevo_caso_asignado";
const TPL_RESUMEN = process.env.KAPSO_TPL_RESUMEN || "resumen_casos";

export const kapsoReady = () => Boolean(API_KEY && PHONE_NUMBER_ID);

// ── Normalizar teléfono a E.164 (Colombia por defecto) ───────────
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d.length >= 11 ? d : null;
  d = d.replace(/\D/g, "");
  if (d.startsWith("57") && d.length >= 12) return `+${d}`;
  if (d.length === 10 && d.startsWith("3")) return `+57${d}`; // móvil colombiano
  if (d.length >= 10) return `+${d}`;
  return null;
}

// ── Enviar una plantilla ─────────────────────────────────────────
// Meta exige parámetros CON NOMBRE (minúsculas + guion bajo), p.ej. {{abogado}}.
// Por eso el body va como Record<nombre_variable, valor> y cada parámetro
// se envía con `parameter_name`.
export async function sendTemplate(
  to: string,
  templateName: string,
  bodyParams: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  if (!kapsoReady()) {
    console.warn("[kapso] KAPSO_API_KEY / KAPSO_PHONE_NUMBER_ID no configurados — se omite el envío");
    return { ok: false, error: "kapso_no_config" };
  }
  const phone = normalizePhone(to);
  if (!phone) return { ok: false, error: "telefono_invalido" };

  const entries = Object.entries(bodyParams);
  const body = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: LANG },
      components: entries.length
        ? [{ type: "body", parameters: entries.map(([name, text]) => ({ type: "text", parameter_name: name, text: text || "-" })) }]
        : [],
    },
  };

  try {
    const res = await fetch(`${BASE}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY! },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error(`[kapso] envío ${templateName} → ${phone} falló (${res.status}): ${txt}`);
      return { ok: false, error: `http_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[kapso] error de red:", e);
    return { ok: false, error: "network" };
  }
}

// ── Notificación: caso nuevo asignado a un abogado ───────────────
interface CasoLike {
  titulo: string;
  suscriptor_nombre?: string | null;
  area: string;
  prioridad?: string | null;
  abogado?: string | null;
  fecha_limite?: string | null;
}

export async function notifyNuevoCaso(caso: CasoLike): Promise<void> {
  if (!kapsoReady() || !caso.abogado) return;
  const supabase = createAdminClient();
  const { data: ab } = await supabase
    .from("equipo")
    .select("nombre, telefono")
    .eq("nombre", caso.abogado)
    .eq("role", "abogado")
    .maybeSingle();

  const phone = normalizePhone(ab?.telefono);
  if (!phone) {
    console.warn(`[kapso] abogado "${caso.abogado}" sin teléfono válido — no se notifica`);
    return;
  }

  const deadline = caso.fecha_limite
    ? new Date(caso.fecha_limite).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
    : "Sin fecha límite";

  // Variables (con nombre) de la plantilla `nuevo_caso_asignado`.
  await sendTemplate(phone, TPL_NUEVO_CASO, {
    abogado: caso.abogado,
    caso: caso.titulo,
    cliente: caso.suscriptor_nombre || "Sin cliente",
    area: caso.area,
    prioridad: caso.prioridad || "normal",
    fecha_limite: deadline,
  });
}

export { TPL_RESUMEN };
