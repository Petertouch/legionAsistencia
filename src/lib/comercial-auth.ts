import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

// Portal de PRE-APROBACIÓN para el equipo comercial (link externo con su propio login).
// Cuenta por defecto (overridable por env sin tocar código):
//   COMERCIAL_EMAIL           -> correo autorizado
//   COMERCIAL_PASSWORD_HASH   -> hash bcrypt de la clave
const EMAIL = (process.env.COMERCIAL_EMAIL || "marthanicolas@hotmail.com").toLowerCase().trim();
const PASS_HASH = process.env.COMERCIAL_PASSWORD_HASH || "$2b$10$.n7jW/WdwRISFDsm8rdPT.O3CgpsqpWxIFwNrT9NkQbNkLtB89IGW";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-cambia-esto");
export const COMERCIAL_COOKIE = "comercial-session";

export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  if ((email || "").toLowerCase().trim() !== EMAIL) return false;
  return bcrypt.compare(password || "", PASS_HASH);
}

export async function issueToken(email: string): Promise<string> {
  return new SignJWT({ portal: "comercial", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);
}

export async function verifyToken(token: string | undefined): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.portal === "comercial" ? payload : null;
  } catch {
    return null;
  }
}

// Devuelve la sesión comercial válida a partir de la cookie, o null.
export async function getComercialSession(request: NextRequest): Promise<JWTPayload | null> {
  return verifyToken(request.cookies.get(COMERCIAL_COOKIE)?.value);
}
