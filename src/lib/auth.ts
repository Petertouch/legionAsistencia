import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import type { UserRole } from "./stores/auth-store";

const COOKIE_NAME = "legion-session";
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export interface SessionPayload {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  jti?: string;
}

// ── Crear token JWT con JTI único ──
export async function createSessionToken(payload: SessionPayload): Promise<{ token: string; jti: string; expiresAt: Date }> {
  const jti = nanoid(21);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const token = await new SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setJti(jti)
    .setExpirationTime("8h")
    .sign(SECRET);
  return { token, jti, expiresAt };
}

// ── Verificar token JWT ──
export async function verifySessionToken(token: string): Promise<(SessionPayload & { jti: string }) | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload & { jti: string };
  } catch {
    return null;
  }
}

// ── Setear cookie de sesión ──
export async function setSessionCookie(payload: SessionPayload): Promise<{ jti: string; expiresAt: Date }> {
  const { token, jti, expiresAt } = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
  return { jti, expiresAt };
}

// ── Eliminar cookie de sesión ──
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ── Leer sesión desde cookies ──
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export { COOKIE_NAME };
