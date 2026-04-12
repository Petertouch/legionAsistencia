import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, type SessionPayload } from "@/lib/auth";
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
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: member } = await supabase
      .from("equipo")
      .select("id, nombre, email, password, role")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!member || !member.password) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const isHash = member.password.startsWith("$2");
    const matches = isHash
      ? await bcrypt.compare(password, member.password)
      : member.password === password;

    if (!matches) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!isHash) {
      const hashed = await bcrypt.hash(password, 12);
      await supabase.from("equipo").update({ password: hashed }).eq("id", member.id);
    }

    const session: SessionPayload = {
      id: member.id,
      nombre: member.nombre,
      email: member.email,
      role: member.role || "abogado",
    };
    await setSessionCookie(session);

    return NextResponse.json({ user: session });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
