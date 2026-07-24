import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { revokeSession } from "@/lib/sessions";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

const AUTH_PROVIDER = process.env.AUTH_PROVIDER || "legacy";

export async function POST(request: NextRequest) {
  if (AUTH_PROVIDER === "supabase") {
    const ssr = await createServerSupabase();
    await ssr.auth.signOut();
    return NextResponse.json({ ok: true });
  }

  // legacy: revocar y limpiar la cookie propia
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
