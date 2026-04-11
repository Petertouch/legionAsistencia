import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Rate limiting: 5 firmas de contrato por hora por IP (anti-spam del flujo público /r/[code])
const firmaAttempts = new Map<string, number[]>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = (firmaAttempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  firmaAttempts.set(ip, attempts);
  if (attempts.length >= MAX_ATTEMPTS) return true;
  attempts.push(now);
  firmaAttempts.set(ip, attempts);
  return false;
}

// POST: insert a contract from the public referral flow (/r/[code]).
// Uses the service role to bypass RLS. The route validates that the lanza_code
// belongs to an active aliado before allowing the insert.
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera una hora." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const {
      lead_id,
      lanza_code,
      nombre,
      cedula,
      telefono,
      telefono2,
      email,
      estado_civil,
      grado,
      fuerza,
      unidad,
      direccion,
      ciudad,
      departamento,
      plan,
      precio,
      firma_data,
      foto_data,
      cedula_frente,
      cedula_reverso,
      hash,
    } = body;

    // Required fields
    if (!nombre || !cedula || !telefono || !plan || !precio || !firma_data || !lanza_code) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Validate that lanza_code exists and is active (anti-spam: el flujo público
    // solo está disponible vía un código de aliado válido).
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

    const { data: contratoRow, error } = await supabase
      .from("contratos")
      .insert({
        lead_id: lead_id || null,
        nombre: String(nombre).trim(),
        cedula: String(cedula).trim(),
        telefono: String(telefono).trim(),
        telefono2: telefono2 || null,
        email: email ? String(email).trim() : null,
        estado_civil: estado_civil || null,
        grado: grado || null,
        fuerza: fuerza || null,
        unidad: unidad || null,
        direccion: direccion || null,
        ciudad: ciudad || null,
        plan,
        precio,
        firma_data,
        foto_data,
        hash,
        nombre_cliente: String(nombre).trim(),
        cedula_cliente: String(cedula).trim(),
        datos_completos: {
          lanza_code,
          departamento: departamento || null,
          cedula_frente: cedula_frente || null,
          cedula_reverso: cedula_reverso || null,
        },
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: contratoRow?.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
