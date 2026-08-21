import Anthropic from "@anthropic-ai/sdk";

// Datos que extraemos de la "ficha de vinculación" (contrato físico escaneado).
export interface FichaExtraida {
  nombre: string;
  cedula: string;
  telefono: string;
  telefono2: string;
  email: string;
  estado_civil: string;
  grado: string;
  fuerza: string;
  unidad: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  plan: string;   // "Base" | "Plus" | "Élite"
  precio: string; // valor de la cuota, p.ej. "39.000"
  fecha: string;  // ISO YYYY-MM-DD
  beneficiarios: { nombre: string; edad: string; parentesco: string }[];
  confianza_baja: string[]; // nombres de campos con letra dudosa
}

export function extractionAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const PROMPT = `Eres un asistente que extrae datos de una "FICHA DE VINCULACIÓN" de Legión Jurídica (contrato de servicios jurídicos, escaneado, escrito a mano).

El documento tiene: ciudad y fecha; datos del afiliado (nombres y apellidos, No. de identificación/cédula, teléfono(s), estado civil, grado, fuerza, unidad, dirección, correo electrónico, ciudad); una tabla de PLANES (Base, Plus, Élite) donde UNO está marcado con una X; y una tabla de BENEFICIARIOS (nombres, edad, parentesco). Puede haber una hoja de LIBRANZA con el número de cuotas y el valor de la cuota.

Extrae los datos y responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin markdown), con exactamente estas llaves:
{
  "nombre": "nombres y apellidos completos",
  "cedula": "solo dígitos, sin puntos",
  "telefono": "primer teléfono, solo dígitos",
  "telefono2": "segundo teléfono si existe, si no ''",
  "email": "correo electrónico en minúsculas",
  "estado_civil": "Soltero/Casado/Unión libre/'' ",
  "grado": "grado militar/policial tal como aparece, o ''",
  "fuerza": "Ejército/Fuerza Aérea/Armada/Cremil/Pensionado/Comando General/Policía/Ministerio de Defensa/Otra, o ''",
  "unidad": "unidad o pagaduría (p.ej. Casur, CAN), o ''",
  "direccion": "dirección de residencia",
  "ciudad": "ciudad de residencia",
  "departamento": "departamento si se puede inferir de la ciudad, o ''",
  "plan": "Base | Plus | Élite (el que esté marcado con X)",
  "precio": "valor de la cuota mensual del plan marcado, con puntos de miles (p.ej. 39.000)",
  "fecha": "fecha del contrato en formato YYYY-MM-DD",
  "beneficiarios": [ { "nombre": "...", "edad": "número o ''", "parentesco": "Esposa/Hijo/Hija/Madre/Padre/Hermano/Sobrino/etc." } ],
  "confianza_baja": [ "lista de las llaves anteriores cuyo valor NO estás seguro por la letra a mano" ]
}

Reglas: si un campo no aparece, usa "" (o [] para beneficiarios). No inventes datos. Para 'precio', si no hay libranza usa el valor impreso del plan marcado (Base 39.000 / Plus 51.000 / Élite 69.000 en formato viejo, o Base 47.000 / Plus 60.000 / Élite 78.000 en formato nuevo). Marca en 'confianza_baja' cédulas, correos y teléfonos que se lean con dificultad.`;

interface ExtractResult {
  data: FichaExtraida | null;
  error?: string;
  raw?: string;
}

const EMPTY: FichaExtraida = {
  nombre: "", cedula: "", telefono: "", telefono2: "", email: "",
  estado_civil: "", grado: "", fuerza: "", unidad: "", direccion: "",
  ciudad: "", departamento: "", plan: "", precio: "", fecha: "",
  beneficiarios: [], confianza_baja: [],
};

function coerce(obj: Record<string, unknown>): FichaExtraida {
  const s = (v: unknown) => (v == null ? "" : String(v)).trim();
  const benRaw = Array.isArray(obj.beneficiarios) ? obj.beneficiarios : [];
  const beneficiarios = benRaw
    .map((b) => {
      const o = (b || {}) as Record<string, unknown>;
      return { nombre: s(o.nombre), edad: s(o.edad), parentesco: s(o.parentesco) };
    })
    .filter((b) => b.nombre);
  const conf = Array.isArray(obj.confianza_baja) ? obj.confianza_baja.map(s).filter(Boolean) : [];
  return {
    ...EMPTY,
    nombre: s(obj.nombre), cedula: s(obj.cedula).replace(/\D/g, ""),
    telefono: s(obj.telefono).replace(/\D/g, ""), telefono2: s(obj.telefono2).replace(/\D/g, ""),
    email: s(obj.email).toLowerCase(), estado_civil: s(obj.estado_civil),
    grado: s(obj.grado), fuerza: s(obj.fuerza), unidad: s(obj.unidad),
    direccion: s(obj.direccion), ciudad: s(obj.ciudad), departamento: s(obj.departamento),
    plan: s(obj.plan), precio: s(obj.precio), fecha: s(obj.fecha),
    beneficiarios, confianza_baja: conf,
  };
}

// Recibe el PDF en base64 y devuelve la ficha extraída (o error legible).
export async function extractFichaFromPdf(base64Pdf: string): Promise<ExtractResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { data: null, error: "Falta configurar ANTHROPIC_API_KEY en el servidor." };
  }
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = process.env.CONTRATO_EXTRACT_MODEL || "claude-sonnet-5";
    const resp = await client.messages.create({
      model,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Pdf } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });
    const textPart = resp.content.find((c) => c.type === "text");
    const raw = textPart && "text" in textPart ? textPart.text : "";
    const jsonStr = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) return { data: null, error: "La IA no devolvió JSON.", raw };
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    return { data: coerce(parsed), raw };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error de extracción" };
  }
}
