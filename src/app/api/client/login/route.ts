import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

const CLIENT_AUTH = process.env.CLIENT_AUTH_PROVIDER || process.env.NEXT_PUBLIC_CLIENT_AUTH_PROVIDER || "legacy";

const SESSION_COLS = "id, nombre, cedula, email, telefono, plan, estado_pago, rama, rango, debe_cambiar_clave";
type SuscriptorRow = {
  id: string; nombre: string; cedula: string; email: string | null; telefono: string | null;
  plan: string | null; estado_pago: string | null; rama: string | null; rango: string | null;
  debe_cambiar_clave: boolean | null;
};
const sessionShape = (s: SuscriptorRow) => ({
  suscriptor_id: s.id, nombre: s.nombre, cedula: s.cedula, email: s.email || "",
  telefono: s.telefono, plan: s.plan, estado_pago: s.estado_pago,
  rama: s.rama || "", rango: s.rango || "", debe_cambiar_clave: s.debe_cambiar_clave ?? false,
});

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
    const body = await request.json();

    // ══ Modo Supabase Auth: login por EMAIL ══
    if (CLIENT_AUTH === "supabase") {
      const email = (body.email || "").toLowerCase().trim();
      const clave = body.clave;
      if (!email || !clave) {
        return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
      }
      const ssr = await createServerSupabase();
      const { data, error } = await ssr.auth.signInWithPassword({ email, password: clave });
      if (error || !data.user) {
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
        return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
      }
      const admin = createAdminClient();
      const { data: s } = await admin
        .from("suscriptores").select(SESSION_COLS)
        .eq("auth_user_id", data.user.id).maybeSingle();
      if (!s) {
        await ssr.auth.signOut();
        return NextResponse.json({ error: "Esta cuenta no es de cliente" }, { status: 403 });
      }
      return NextResponse.json(sessionShape(s as SuscriptorRow));
    }

    // ══ Modo legacy: login por CÉDULA ══
    const { cedula, clave } = body;

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
