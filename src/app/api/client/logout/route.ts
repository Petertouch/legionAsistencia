import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

const CLIENT_AUTH = process.env.CLIENT_AUTH_PROVIDER || process.env.NEXT_PUBLIC_CLIENT_AUTH_PROVIDER || "legacy";

export async function POST() {
  if (CLIENT_AUTH === "supabase") {
    const ssr = await createServerSupabase();
    await ssr.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
