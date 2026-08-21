import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, issueToken, COMERCIAL_COOKIE } from "@/lib/comercial-auth";

// Rate limit: 5 intentos / 15 min por IP
const attempts = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const a = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  attempts.set(ip, a);
  if (a.length >= 5) return true;
  a.push(now);
  attempts.set(ip, a);
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });

  try {
    const { email, password } = await request.json();
    const ok = await verifyCredentials(email, password);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ error: "Correo o clave incorrectos" }, { status: 401 });
    }
    const token = await issueToken((email || "").toLowerCase().trim());
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COMERCIAL_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
