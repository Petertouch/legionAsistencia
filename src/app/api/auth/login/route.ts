import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, type SessionPayload } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin credentials desde env (temporal hasta migrar equipo a Supabase)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "a@a.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "legion2026";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const emailNorm = email.toLowerCase().trim();

    // ── 1. Verificar si es admin ──
    if (emailNorm === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const session: SessionPayload = {
        id: "admin-1",
        nombre: "Admin",
        email: emailNorm,
        role: "admin",
      };
      await setSessionCookie(session);
      return NextResponse.json({ user: session });
    }

    // ── 2. Verificar en tabla equipo (abogados) ──
    const supabase = createAdminClient();
    const { data: miembro } = await supabase
      .from("equipo")
      .select("id, nombre, email, password")
      .eq("email", emailNorm)
      .single();

    if (miembro && miembro.password === password) {
      const session: SessionPayload = {
        id: miembro.id,
        nombre: miembro.nombre,
        email: miembro.email,
        role: "abogado",
      };
      await setSessionCookie(session);
      return NextResponse.json({ user: session });
    }

    // ── Credenciales inválidas ──
    // Delay para prevenir timing attacks
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
