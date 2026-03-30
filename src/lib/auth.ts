import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "./stores/auth-store";

const COOKIE_NAME = "legion-session";
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "legion-fallback-secret-change-me-in-prod"
);

export interface SessionPayload {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
}

// ── Crear token JWT ──
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

// ── Verificar token JWT ──
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ── Setear cookie de sesión (server action / route handler) ──
export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
}

// ── Eliminar cookie de sesión ──
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ── Leer sesión desde cookies (para server components / route handlers) ──
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// ── Verificar token desde string (para middleware, que no puede usar cookies() directamente) ──
export { COOKIE_NAME };
