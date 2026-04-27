import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Rate limit por IP: 10 leads/hora (anti-spam del flujo público /r/[code])
const ipAttempts = new Map<string, number[]>();
const IP_MAX = 10;
const IP_WINDOW_MS = 60 * 60 * 1000;

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (ipAttempts.get(ip) || []).filter((t) => now - t < IP_WINDOW_MS);
  ipAttempts.set(ip, list);
  if (list.length >= IP_MAX) return true;
  list.push(now);
  ipAttempts.set(ip, list);
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

// Construye el filtro OR de Supabase para buscar candidatos con los datos del input.
function buildFilter(cedulaN: string, telefonoN: string, emailN: string | null): string {
  const phoneTail = telefonoN.slice(-7);
  const parts: string[] = [
    `cedula.ilike.%${cedulaN}%`,
    `telefono.ilike.%${phoneTail}%`,
  ];
  if (emailN) parts.push(`email.ilike.${emailN}`);
  return parts.join(",");
}

// POST: Crea un lead desde el flujo público /r/[code] con sistema "smart-resume":
//
// - Bloquea duplicados estrictos (suscriptores activos, contratos firmados,
//   leads completados/descartados).
// - Detecta leads en proceso del mismo cliente (status nuevo|en_proceso|contactado|abandonado)
//   y devuelve { resume: true } con los datos del lead viejo para que el frontend
//   ofrezca continuar donde quedó.
// - Auto-marca como "abandonado" leads con > 3 días hábiles sin actividad (lazy on read).
// - Aplica first-touch attribution: el lead pertenece al primer aliado que lo trajo.
// - Rate limit por IP (10/hora) y por cédula (5 reanudaciones/24h).
//
// Usa service role para bypasear RLS.
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isIpRateLimited(ip)) {
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
    const filter = buildFilter(cedulaN, telefonoN, emailN);

    // 1) ¿Ya es suscriptor activo? — bloqueo duro
    const { data: suscriptorCands } = await supabase
      .from("suscriptores")
      .select("id, cedula, email, telefono")
      .or(filter)
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

    // 2) ¿Hay contrato firmado con esos datos? — bloqueo duro
    const { data: contratoCands } = await supabase
      .from("contratos")
      .select("id, cedula, email, telefono")
      .or(filter)
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

    // 3) Buscar leads existentes con esos datos (smart-resume)
    const { data: leadCands } = await supabase
      .from("lanza_leads")
      .select("id, cedula, email, telefono, status, current_step, last_activity_at, resumed_count, nombre, plan_interes, lanza_id, lanza_code")
      .or(filter)
      .limit(20);

    type LeadCandidate = RowWithIdentity & {
      id: string;
      status: string;
      current_step: number | null;
      last_activity_at: string | null;
      resumed_count: number | null;
      nombre: string | null;
      plan_interes: string | null;
      lanza_id: string | null;
      lanza_code: string | null;
    };

    let matchedLead: LeadCandidate | null = null;
    for (const row of (leadCands || []) as LeadCandidate[]) {
      if (findConflictField(row, cedulaN, emailN, telefonoN)) {
        matchedLead = row;
        break;
      }
    }

    if (matchedLead) {
      // Lazy abandonment: si lleva > 3 días hábiles (~72h) sin actividad y aún no completado/descartado,
      // lo marcamos como abandonado en este momento.
      const SEVEN_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
      const lastActivity = matchedLead.last_activity_at
        ? new Date(matchedLead.last_activity_at).getTime()
        : 0;
      const isStale = lastActivity > 0 && Date.now() - lastActivity > SEVEN_DAYS_MS;
      const reanudableStatuses = ["nuevo", "en_proceso", "contactado", "abandonado"];

      if (
        isStale &&
        !["completado", "descartado"].includes(matchedLead.status) &&
        matchedLead.status !== "abandonado"
      ) {
        await supabase
          .from("lanza_leads")
          .update({ status: "abandonado", abandonado_at: new Date().toISOString() })
          .eq("id", matchedLead.id);
        matchedLead.status = "abandonado";
      }

      // Bloqueo duro: lead ya completado (firma + suscriptor) o descartado por aliado.
      if (matchedLead.status === "completado") {
        return NextResponse.json(
          {
            error: "Esta cédula ya completó su registro como suscriptor de Legión Jurídica. Contáctanos por WhatsApp para ayudarte.",
            conflict: "completado",
          },
          { status: 409 }
        );
      }
      if (matchedLead.status === "descartado") {
        return NextResponse.json(
          {
            error: "No podemos procesar este registro en este momento. Contáctanos por WhatsApp para ayudarte.",
            conflict: "descartado",
          },
          { status: 409 }
        );
      }

      // Estado reanudable: ofrecer al usuario continuar donde quedó.
      if (reanudableStatuses.includes(matchedLead.status)) {
        // Rate limit por cédula: 5 reanudaciones/24h
        const resumedCount = matchedLead.resumed_count || 0;
        if (resumedCount >= 5) {
          return NextResponse.json(
            {
              error: "Demasiados intentos con esta cédula. Contáctanos por WhatsApp para ayudarte.",
              conflict: "rate_limit",
            },
            { status: 429 }
          );
        }

        // Incrementa el contador y actualiza last_activity_at
        await supabase
          .from("lanza_leads")
          .update({
            resumed_count: resumedCount + 1,
            last_activity_at: new Date().toISOString(),
            status: matchedLead.status === "abandonado" ? "en_proceso" : matchedLead.status,
          })
          .eq("id", matchedLead.id);

        return NextResponse.json({
          resume: true,
          lead: {
            id: matchedLead.id,
            current_step: matchedLead.current_step || 1,
            nombre: matchedLead.nombre,
            cedula: matchedLead.cedula,
            telefono: matchedLead.telefono,
            email: matchedLead.email,
            plan_interes: matchedLead.plan_interes,
            last_activity_at: matchedLead.last_activity_at,
          },
        });
      }
    }

    // 4) Validar que el lanza_code exista y esté activo (solo para leads nuevos)
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

    // 5) Insertar lead nuevo con datos normalizados
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
        current_step: 1,
        last_activity_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: leadData?.id, resume: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
