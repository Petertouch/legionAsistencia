import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

const CLIENT_AUTH = process.env.CLIENT_AUTH_PROVIDER || process.env.NEXT_PUBLIC_CLIENT_AUTH_PROVIDER || "legacy";

// Rate limiting: 3 registrations per 15 minutes per IP
const registerAttempts = new Map<string, number[]>();
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = (registerAttempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  registerAttempts.set(ip, attempts);
  if (attempts.length >= MAX_ATTEMPTS) return true;
  attempts.push(now);
  registerAttempts.set(ip, attempts);
  return false;
}

// POST: save password to contrato + create suscriptor (with hashed password)
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
  }

  try {
    const { contrato_id, nombre, cedula, telefono, email, plan, fuerza, grado, clave } = await request.json();

    if (!contrato_id || !nombre || !cedula || !telefono || !plan) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Generate temp password if not provided, or use the one from the form
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const tempClave = clave || ("LJ-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
    const hashedClave = await bcrypt.hash(tempClave, 12);

    // Save hashed password to contrato
    const { error: claveError } = await supabase
      .from("contratos")
      .update({ clave: hashedClave })
      .eq("id", contrato_id);

    if (claveError) {
      return NextResponse.json({ error: claveError.message }, { status: 500 });
    }

    // Check for duplicate cedula
    const { data: existing } = await supabase
      .from("suscriptores")
      .select("id")
      .eq("cedula", cedula.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Ya existe un suscriptor con esta cédula" }, { status: 409 });
    }

    // Create suscriptor with hashed password and flag to change it
    const emailNorm = email?.trim().toLowerCase() || null;
    const { data: nuevo, error: suscError } = await supabase.from("suscriptores").insert({
      contrato_id,
      nombre: nombre.trim(),
      cedula: cedula.trim(),
      telefono: telefono.trim(),
      email: emailNorm,
      plan,
      estado_pago: "Pendiente",
      rama: fuerza || null,
      rango: grado || null,
      clave: hashedClave,
      debe_cambiar_clave: true,
    }).select("id").single();

    if (suscError) {
      return NextResponse.json({ error: suscError.message }, { status: 500 });
    }

    // En modo Supabase Auth: crear el usuario en auth.users (login por email).
    if (CLIENT_AUTH === "supabase" && emailNorm && nuevo?.id) {
      const { data: created, error: authErr } = await supabase.auth.admin.createUser({
        email: emailNorm,
        password: tempClave,
        email_confirm: true,
        app_metadata: { role: "cliente", profile_id: nuevo.id },
        user_metadata: { nombre: nombre.trim() },
      });
      if (!authErr && created?.user) {
        await supabase.from("suscriptores").update({ auth_user_id: created.user.id }).eq("id", nuevo.id);
      } else {
        console.error("[client/register] createUser:", authErr?.message);
      }
    }

    // Return the temp password so it can be included in the welcome email
    return NextResponse.json({ ok: true, clave_temporal: tempClave });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
