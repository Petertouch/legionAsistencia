import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

// Rate limiting: 5 attempts per 15 minutes per IP
const loginAttempts = new Map<string, number[]>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = (loginAttempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  loginAttempts.set(ip, attempts);
  if (attempts.length >= MAX_ATTEMPTS) return true;
  attempts.push(now);
  loginAttempts.set(ip, attempts);
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
  }

  try {
    const { cedula, clave } = await request.json();

    if (!cedula || !clave) {
      return NextResponse.json({ error: "Cédula y contraseña requeridos" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: suscriptor, error } = await supabase
      .from("suscriptores")
      .select("id, nombre, cedula, email, telefono, plan, estado_pago, rama, rango, clave, debe_cambiar_clave")
      .eq("cedula", cedula.trim())
      .single();

    if (error || !suscriptor || !suscriptor.clave) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ error: "Cédula o contraseña incorrectos" }, { status: 401 });
    }

    // Support both bcrypt and plaintext (lazy migration)
    const isHash = suscriptor.clave.startsWith("$2");
    const matches = isHash
      ? await bcrypt.compare(clave, suscriptor.clave)
      : suscriptor.clave === clave;

    if (!matches) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ error: "Cédula o contraseña incorrectos" }, { status: 401 });
    }

    // Lazy hash migration
    if (!isHash) {
      const hashed = await bcrypt.hash(clave, 12);
      await supabase.from("suscriptores").update({ clave: hashed }).eq("id", suscriptor.id);
    }

    // Return session data (without clave)
    return NextResponse.json({
      suscriptor_id: suscriptor.id,
      nombre: suscriptor.nombre,
      cedula: suscriptor.cedula,
      email: suscriptor.email || "",
      telefono: suscriptor.telefono,
      plan: suscriptor.plan,
      estado_pago: suscriptor.estado_pago,
      rama: suscriptor.rama || "",
      rango: suscriptor.rango || "",
      debe_cambiar_clave: suscriptor.debe_cambiar_clave ?? false,
    });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
