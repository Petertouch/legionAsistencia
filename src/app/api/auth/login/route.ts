import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, type SessionPayload } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

const AUTH_PROVIDER = process.env.AUTH_PROVIDER || "legacy";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
// Break-glass admin: se prefiere el hash bcrypt (ADMIN_PASSWORD_HASH).
// ADMIN_PASSWORD (texto plano) solo se acepta como fallback temporal de migración.
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
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

    // ══ Modo Supabase Auth ══
    if (AUTH_PROVIDER === "supabase") {
      const ssr = await createServerSupabase();
      const { data, error } = await ssr.auth.signInWithPassword({ email: emailNorm, password });
      if (error || !data.user) {
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
        return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
      }
      // Construir el MISMO shape { user: {id,nombre,email,role} } (id = equipo.id).
      const admin = createAdminClient();
      const { data: miembro } = await admin
        .from("equipo")
        .select("id, nombre, email, role")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();
      const meta = (data.user.app_metadata || {}) as Record<string, unknown>;
      const um = (data.user.user_metadata || {}) as Record<string, unknown>;
      const user: SessionPayload = {
        id: miembro?.id || (meta.profile_id as string) || data.user.id,
        nombre: miembro?.nombre || (um.nombre as string) || "",
        email: data.user.email || emailNorm,
        role: (miembro?.role || (meta.role as string) || "abogado") as SessionPayload["role"],
      };
      return NextResponse.json({ user });
    }

    // ══ Modo legacy (JWT propio) ══
    // ── 1. Verificar en tabla equipo (fuente de verdad principal) ──
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

    // ── 2. Break-glass admin por env (solo si la cuenta de tabla no aplicó) ──
    // Se compara contra el hash bcrypt; el texto plano queda como fallback de transición.
    if (ADMIN_EMAIL && emailNorm === ADMIN_EMAIL.toLowerCase()) {
      const ok = ADMIN_PASSWORD_HASH
        ? await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
        : ADMIN_PASSWORD
          ? password === ADMIN_PASSWORD
          : false;
      if (ok) {
        const session: SessionPayload = { id: "admin-1", nombre: "Admin", email: emailNorm, role: "admin" };
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
