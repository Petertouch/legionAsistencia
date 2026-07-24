import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateStaffAuthUser } from "@/lib/supabase/auth-sync";
import { sendTemplate } from "@/lib/mail-templates";
import { revokeAllUserSessions } from "@/lib/sessions";
import bcrypt from "bcryptjs";

const AUTH_PROVIDER = process.env.AUTH_PROVIDER || "legacy";
const CLIENT_AUTH = process.env.CLIENT_AUTH_PROVIDER || process.env.NEXT_PUBLIC_CLIENT_AUTH_PROVIDER || "legacy";

// Track used reset tokens (single-use)
const usedResetTokens = new Set<string>();

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://legionjuridica.com";

// Rate limiting: 3 reset requests per 15 minutes per IP
const resetAttempts = new Map<string, number[]>();
const MAX_RESET_ATTEMPTS = 3;
const RESET_WINDOW_MS = 15 * 60 * 1000;

function isResetRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = (resetAttempts.get(ip) || []).filter((t) => now - t < RESET_WINDOW_MS);
  resetAttempts.set(ip, attempts);
  if (attempts.length >= MAX_RESET_ATTEMPTS) return true;
  attempts.push(now);
  resetAttempts.set(ip, attempts);
  return false;
}

// ── POST: Solicitar reset (envía email con link) ──
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isResetRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Espera 15 minutos." }, { status: 429 });
  }

  try {
    const { identifier, type } = await request.json();
    // type: "cliente" (busca por cédula) o "admin" (busca por email)

    if (!identifier) {
      return NextResponse.json({ error: "Campo requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();
    let email: string | null = null;
    let nombre = "";
    let userId = "";
    let resetType = type || "cliente";

    if (resetType === "admin") {
      // Buscar en equipo por email
      const { data: miembro } = await supabase
        .from("equipo")
        .select("id, nombre, email")
        .eq("email", identifier.toLowerCase().trim())
        .single();

      // También verificar admin hardcodeado
      const adminEmail = process.env.ADMIN_EMAIL ?? null;
      if (adminEmail && identifier.toLowerCase().trim() === adminEmail) {
        // No revelamos si existe o no
        email = adminEmail;
        nombre = "Admin";
        userId = "admin-1";
      } else if (miembro) {
        email = miembro.email;
        nombre = miembro.nombre;
        userId = miembro.id;
      }
    } else {
      // Buscar suscriptor por cédula
      const { data: suscriptor } = await supabase
        .from("suscriptores")
        .select("id, nombre, email, cedula")
        .eq("cedula", identifier.trim())
        .single();

      if (suscriptor && suscriptor.email) {
        email = suscriptor.email;
        nombre = suscriptor.nombre;
        userId = suscriptor.id;
      }
    }

    // Siempre respondemos igual para no revelar si el usuario existe
    if (!email) {
      // Delay para prevenir enumeración
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
      return NextResponse.json({ ok: true, message: "Si el usuario existe, se enviará un email" });
    }

    // Generar token JWT con 1 hora de expiración
    const token = await new SignJWT({ userId, type: resetType, email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(SECRET);

    // Construir link
    const resetPath = resetType === "admin" ? "/reset-clave" : "/mi-caso/reset-clave";
    const resetLink = `${BASE_URL}${resetPath}?token=${token}`;

    // Cuerpo desde la BD (mail_templates → "recuperar-clave").
    await sendTemplate({
      slug: "recuperar-clave",
      to: email,
      force: true,
      variables: { nombre, reset_link: resetLink },
    });

    return NextResponse.json({ ok: true, message: "Si el usuario existe, se enviará un email" });
  } catch (err) {
    console.error("[RESET PASSWORD]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// ── PUT: Cambiar contraseña con token ──
export async function PUT(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    // Verificar token
    let payload;
    let tokenJti: string | undefined;
    try {
      const result = await jwtVerify(token, SECRET);
      payload = result.payload as { userId: string; type: string; email: string; jti?: string };
      tokenJti = result.payload.jti;
    } catch {
      return NextResponse.json({ error: "Enlace expirado o inválido. Solicita uno nuevo." }, { status: 401 });
    }

    // Single-use check
    const tokenId = tokenJti || `${payload.userId}-${payload.type}`;
    if (usedResetTokens.has(tokenId)) {
      return NextResponse.json({ error: "Este enlace ya fue utilizado. Solicita uno nuevo." }, { status: 401 });
    }

    const supabase = createAdminClient();

    if (payload.type === "admin") {
      if (payload.userId === "admin-1") {
        return NextResponse.json({ error: "Contacta al administrador del sistema para cambiar esta contraseña" }, { status: 400 });
      }
      const hashed = await bcrypt.hash(newPassword, 12);
      const { error } = await supabase
        .from("equipo")
        .update({ password: hashed })
        .eq("id", payload.userId);

      if (error) throw error;

      if (AUTH_PROVIDER === "supabase") {
        // Escribir la clave también en Supabase Auth (fuente de verdad del login).
        const { data: row } = await supabase
          .from("equipo")
          .select("auth_user_id")
          .eq("id", payload.userId)
          .maybeSingle();
        if (row?.auth_user_id) await updateStaffAuthUser(row.auth_user_id as string, { password: newPassword });
      } else {
        // legacy: revocar todas las sesiones existentes del usuario
        await revokeAllUserSessions(payload.userId).catch(() => {});
      }
    } else {
      const hashed = await bcrypt.hash(newPassword, 12);
      const { data: sus, error } = await supabase
        .from("suscriptores")
        .update({ clave: hashed })
        .eq("id", payload.userId)
        .select("auth_user_id")
        .single();

      if (error) throw error;

      // En modo Supabase Auth: fijar la clave también en auth.users.
      if (CLIENT_AUTH === "supabase" && sus?.auth_user_id) {
        await supabase.auth.admin.updateUserById(sus.auth_user_id as string, { password: newPassword }).catch(() => {});
      }
    }

    // Mark token as used
    usedResetTokens.add(tokenId);
    // Auto-cleanup after 1 hour
    setTimeout(() => usedResetTokens.delete(tokenId), 60 * 60 * 1000);

    return NextResponse.json({ ok: true, message: "Contraseña actualizada" });
  } catch (err) {
    console.error("[RESET PASSWORD PUT]", err);
    return NextResponse.json({ error: "Error al actualizar contraseña" }, { status: 500 });
  }
}
