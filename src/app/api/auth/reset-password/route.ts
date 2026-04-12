import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import { revokeAllUserSessions } from "@/lib/sessions";
import bcrypt from "bcryptjs";

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

    // Email HTML
    const emailHtml = `<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#0f1a0f;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#1a2e1a 0%,#0f1a0f 100%);padding:24px 32px 16px;text-align:center;border-bottom:2px solid #C8A96E">
    <div style="width:48px;height:48px;margin:0 auto 12px;background:rgba(200,169,110,0.1);border-radius:50%;border:1px solid rgba(200,169,110,0.2);line-height:48px;font-size:22px">🔐</div>
    <h1 style="margin:0;font-size:18px;font-weight:bold;color:#C8A96E;letter-spacing:1px">RECUPERAR CONTRASEÑA</h1>
    <p style="margin:4px 0 0;font-size:10px;color:rgba(200,169,110,0.4);letter-spacing:2px;text-transform:uppercase">Legión Jurídica</p>
  </div>
  <div style="padding:28px 32px">
    <h2 style="margin:0 0 6px;font-size:18px;color:#ffffff;font-weight:bold">Hola, ${nombre}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:rgba(212,197,160,0.65);line-height:1.6">Recibimos una solicitud para restablecer tu contraseña. Haz click en el botón para crear una nueva.</p>
    <div style="text-align:center;padding:20px 0">
      <a href="${resetLink}" style="display:inline-block;padding:13px 32px;background:#C8A96E;color:#1a1a1a;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;letter-spacing:0.3px">Restablecer contraseña</a>
    </div>
    <div style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:8px;padding:14px 16px;margin:16px 0">
      <p style="margin:0;font-size:13px;color:rgba(234,179,8,0.8);line-height:1.5">⏰ Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este email.</p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:rgba(212,197,160,0.35);line-height:1.5">Si el botón no funciona, copia y pega este enlace:<br/><span style="color:rgba(200,169,110,0.5);word-break:break-all">${resetLink}</span></p>
  </div>
  <div style="background:rgba(0,0,0,0.3);padding:16px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05)">
    <p style="margin:0;font-size:10px;color:rgba(212,197,160,0.25)">Legión Jurídica · Cra 7 # 81-49 Of. 301, Bogotá</p>
  </div>
</div>`;

    await sendMail({
      to: email,
      subject: "Recuperar contraseña — Legión Jurídica",
      html: emailHtml,
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

      // Revoke all existing sessions for this user
      await revokeAllUserSessions(payload.userId).catch(() => {});
    } else {
      const hashed = await bcrypt.hash(newPassword, 12);
      const { error } = await supabase
        .from("suscriptores")
        .update({ clave: hashed })
        .eq("id", payload.userId);

      if (error) throw error;
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
