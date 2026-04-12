import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Rate limit: 10 leads/hora por IP (anti-spam del flujo público /r/[code])
const attempts = new Map<string, number[]>();
const MAX = 10;
const WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, list);
  if (list.length >= MAX) return true;
  list.push(now);
  attempts.set(ip, list);
  return false;
}

const normalizePhone = (s: string | null | undefined) => (s || "").replace(/\D/g, "");
const normalizeEmail = (s: string | null | undefined) => (s || "").trim().toLowerCase();
const normalizeCedula = (s: string | null | undefined) => (s || "").replace(/\D/g, "");

// Match laxo de teléfono: ignora prefijo país (+57 / 57). Compara los últimos
// 10 dígitos (longitud típica de un celular colombiano) o el total si es menor.
function phoneMatches(a: string, b: string): boolean {
  const an = normalizePhone(a);
  const bn = normalizePhone(b);
  if (!an || !bn) return false;
  const tail = (s: string) => (s.length > 10 ? s.slice(-10) : s);
  return tail(an) === tail(bn);
}

interface RowWithIdentity {
  id?: string;
  cedula?: string | null;
  email?: string | null;
  telefono?: string | null;
}

// Determina si un row de la DB matchea con los datos del input ya normalizados.
// Devuelve el campo en conflicto (cédula | correo | teléfono) o null si no hay match.
function findConflictField(
  row: RowWithIdentity,
  cedulaN: string,
  emailN: string | null,
  telefonoN: string
): "cédula" | "correo" | "teléfono" | null {
  if (row.cedula && normalizeCedula(row.cedula) === cedulaN) return "cédula";
  if (emailN && row.email && normalizeEmail(row.email) === emailN) return "correo";
  if (row.telefono && phoneMatches(row.telefono, telefonoN)) return "teléfono";
  return null;
}

// POST: crear un lead desde el flujo público /r/[code] con validación de unicidad
// global por cédula, email y teléfono. Bloquea duplicados en lanza_leads, contratos
// y suscriptores. Usa service role para bypasear RLS.
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera una hora." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { lanza_id, lanza_code, nombre, telefono, email, cedula, plan_interes } = body;

    if (!lanza_code || !nombre || !telefono || !cedula) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const cedulaN = normalizeCedula(String(cedula));
    const telefonoN = normalizePhone(String(telefono));
    const emailN = email ? normalizeEmail(String(email)) : null;

    if (!cedulaN || cedulaN.length < 6) {
      return NextResponse.json({ error: "Cédula inválida" }, { status: 400 });
    }
    if (!telefonoN || telefonoN.length < 7) {
      return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Estrategia: query laxo (filtros amplios con ilike) que trae candidatos,
    // luego normaliza y compara en JS. Esto detecta duplicados aunque los
    // datos en DB tengan formato distinto al input (espacios, guiones, +57, etc).
    // Los últimos 7 dígitos del teléfono son un buen anchor: cubren el número
    // local sin prefijo país y son raros como falsos positivos.
    const phoneTail = telefonoN.slice(-7);

    // Construye los filtros OR del query. Email solo si vino.
    const buildFilter = () => {
      const parts: string[] = [];
      // cédula: match parcial (digits-only no contiene caracteres raros, así que
      // ilike sobre la cédula cruda en DB sí encuentra "12.345.678" cuando buscas "12345678"
      // sólo si los dígitos coinciden — usamos ilike con wildcard al inicio y al final).
      parts.push(`cedula.ilike.%${cedulaN}%`);
      parts.push(`telefono.ilike.%${phoneTail}%`);
      if (emailN) parts.push(`email.ilike.${emailN}`);
      return parts.join(",");
    };

    // 1) ¿Ya es suscriptor activo?
    const { data: suscriptorCands } = await supabase
      .from("suscriptores")
      .select("id, cedula, email, telefono")
      .or(buildFilter())
      .limit(20);

    for (const row of (suscriptorCands || []) as RowWithIdentity[]) {
      const field = findConflictField(row, cedulaN, emailN, telefonoN);
      if (field) {
        return NextResponse.json(
          {
            error: `Esta ${field} ya está registrada como suscriptor de Legión Jurídica. Contáctanos por WhatsApp para ayudarte.`,
            conflict: "suscriptor",
            field,
          },
          { status: 409 }
        );
      }
    }

    // 2) ¿Ya hay contrato firmado con esos datos?
    const { data: contratoCands } = await supabase
      .from("contratos")
      .select("id, cedula, email, telefono")
      .or(buildFilter())
      .limit(20);

    for (const row of (contratoCands || []) as RowWithIdentity[]) {
      const field = findConflictField(row, cedulaN, emailN, telefonoN);
      if (field) {
        return NextResponse.json(
          {
            error: `Esta ${field} ya está registrada con un contrato en proceso. Contáctanos por WhatsApp para ayudarte.`,
            conflict: "contrato",
            field,
          },
          { status: 409 }
        );
      }
    }

    // 3) ¿Ya hay un lead en proceso?
    const { data: leadCands } = await supabase
      .from("lanza_leads")
      .select("id, cedula, email, telefono")
      .or(buildFilter())
      .limit(20);

    for (const row of (leadCands || []) as RowWithIdentity[]) {
      const field = findConflictField(row, cedulaN, emailN, telefonoN);
      if (field) {
        return NextResponse.json(
          {
            error: `Esta ${field} ya está registrada. Contáctanos por WhatsApp para ayudarte.`,
            conflict: "lead",
            field,
          },
          { status: 409 }
        );
      }
    }

    // 4) Validar que el lanza_code exista y esté activo
    const { data: lanza, error: lanzaError } = await supabase
      .from("lanzas")
      .select("id, status")
      .eq("code", lanza_code)
      .single();

    if (lanzaError || !lanza) {
      return NextResponse.json({ error: "Código de aliado inválido" }, { status: 403 });
    }
    if (lanza.status !== "activo") {
      return NextResponse.json({ error: "Aliado inactivo" }, { status: 403 });
    }

    // 5) Insertar lead con los datos normalizados
    const { data: leadData, error } = await supabase
      .from("lanza_leads")
      .insert({
        lanza_id: lanza_id || lanza.id || null,
        lanza_code,
        nombre: String(nombre).trim(),
        telefono: telefonoN,
        email: emailN || "",
        cedula: cedulaN,
        plan_interes: plan_interes || null,
        status: "nuevo",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: leadData?.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
