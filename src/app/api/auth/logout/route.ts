import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { revokeSession } from "@/lib/sessions";

export async function POST(request: NextRequest) {
  // Read token before clearing to revoke it server-side
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session?.jti) {
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
      await revokeSession(session.jti, session.id, expiresAt).catch(() => {});
    }
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
