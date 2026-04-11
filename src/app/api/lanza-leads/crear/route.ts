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

const normalizePhone = (s: string) => s.replace(/\D/g, "");
const normalizeEmail = (s: string) => s.trim().toLowerCase();
const normalizeCedula = (s: string) => s.replace(/\D/g, "");

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

    // 1) ¿Ya es suscriptor activo?
    const { data: suscriptorMatch } = await supabase
      .from("suscriptores")
      .select("id, cedula, email, telefono")
      .or(
        emailN
          ? `cedula.eq.${cedulaN},email.eq.${emailN},telefono.eq.${telefonoN}`
          : `cedula.eq.${cedulaN},telefono.eq.${telefonoN}`
      )
      .limit(1)
      .maybeSingle();

    if (suscriptorMatch) {
      const field =
        suscriptorMatch.cedula === cedulaN
          ? "cédula"
          : suscriptorMatch.email === emailN
            ? "correo"
            : "teléfono";
      return NextResponse.json(
        {
          error: `Esta ${field} ya está registrada como suscriptor de Legión Jurídica. Contáctanos por WhatsApp para ayudarte.`,
          conflict: "suscriptor",
          field,
        },
        { status: 409 }
      );
    }

    // 2) ¿Ya hay contrato firmado con esos datos?
    const { data: contratoMatch } = await supabase
      .from("contratos")
      .select("id, cedula, email, telefono")
      .or(
        emailN
          ? `cedula.eq.${cedulaN},email.eq.${emailN},telefono.eq.${telefonoN}`
          : `cedula.eq.${cedulaN},telefono.eq.${telefonoN}`
      )
      .limit(1)
      .maybeSingle();

    if (contratoMatch) {
      const field =
        contratoMatch.cedula === cedulaN
          ? "cédula"
          : contratoMatch.email === emailN
            ? "correo"
            : "teléfono";
      return NextResponse.json(
        {
          error: `Esta ${field} ya está registrada con un contrato en proceso. Contáctanos por WhatsApp para ayudarte.`,
          conflict: "contrato",
          field,
        },
        { status: 409 }
      );
    }

    // 3) ¿Ya hay un lead en proceso?
    const { data: leadMatch } = await supabase
      .from("lanza_leads")
      .select("id, cedula, email, telefono")
      .or(
        emailN
          ? `cedula.eq.${cedulaN},email.eq.${emailN},telefono.eq.${telefonoN}`
          : `cedula.eq.${cedulaN},telefono.eq.${telefonoN}`
      )
      .limit(1)
      .maybeSingle();

    if (leadMatch) {
      const field =
        leadMatch.cedula === cedulaN
          ? "cédula"
          : leadMatch.email === emailN
            ? "correo"
            : "teléfono";
      return NextResponse.json(
        {
          error: `Esta ${field} ya está registrada. Contáctanos por WhatsApp para ayudarte.`,
          conflict: "lead",
          field,
        },
        { status: 409 }
      );
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
