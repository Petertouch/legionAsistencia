import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const AUTH_PROVIDER = process.env.AUTH_PROVIDER || "legacy";

export async function GET() {
  if (AUTH_PROVIDER === "supabase") {
    const ssr = await createServerSupabase();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    const admin = createAdminClient();
    const { data: miembro } = await admin
      .from("equipo")
      .select("id, nombre, email, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    const meta = (user.app_metadata || {}) as Record<string, unknown>;
    const um = (user.user_metadata || {}) as Record<string, unknown>;
    return NextResponse.json({
      user: {
        id: miembro?.id || (meta.profile_id as string) || user.id,
        nombre: miembro?.nombre || (um.nombre as string) || "",
        email: user.email || "",
        role: miembro?.role || (meta.role as string) || "abogado",
      },
    });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
