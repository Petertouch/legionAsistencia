import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, type SessionPayload } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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

    const emailNorm = email.toLowerCase().trim();

    // ── 1. Verificar si es admin ──
    if (ADMIN_EMAIL && ADMIN_PASSWORD && emailNorm === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const session: SessionPayload = {
        id: "admin-1",
        nombre: "Admin",
        email: emailNorm,
        role: "admin",
      };
      await setSessionCookie(session);
      return NextResponse.json({ user: session });
    }

    // ── 2. Verificar en tabla equipo ──
    const supabase = createAdminClient();
    const { data: miembro } = await supabase
      .from("equipo")
      .select("id, nombre, email, password, role")
      .eq("email", emailNorm)
      .single();

    if (miembro && miembro.password) {
      const isHash = miembro.password.startsWith("$2");
      const matches = isHash
        ? await bcrypt.compare(password, miembro.password)
        : miembro.password === password;

      if (matches) {
        // Lazy migration: hash plaintext password
        if (!isHash) {
          const hashed = await bcrypt.hash(password, 12);
          await supabase.from("equipo").update({ password: hashed }).eq("id", miembro.id);
        }

        const session: SessionPayload = {
          id: miembro.id,
          nombre: miembro.nombre,
          email: miembro.email,
          role: miembro.role || "abogado",
        };
        await setSessionCookie(session);
        return NextResponse.json({ user: session });
      }
    }

    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
