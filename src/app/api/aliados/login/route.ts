import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

const ALIADO_AUTH = process.env.ALIADO_AUTH_PROVIDER || process.env.NEXT_PUBLIC_ALIADO_AUTH_PROVIDER || "legacy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ══ Modo Supabase Auth: login por EMAIL (mantiene el code de sesión) ══
    if (ALIADO_AUTH === "supabase") {
      const email = (body.email || "").toLowerCase().trim();
      const clave = body.clave;
      if (!email || !clave) {
        return NextResponse.json({ error: "Email y clave son requeridos" }, { status: 400 });
      }
      const ssr = await createServerSupabase();
      const { data, error } = await ssr.auth.signInWithPassword({ email, password: clave });
      if (error || !data.user) {
        return NextResponse.json({ error: "Email o clave incorrectos" }, { status: 401 });
      }
      const admin = createAdminClient();
      const { data: aliado } = await admin
        .from("lanzas").select("code, debe_cambiar_clave")
        .eq("auth_user_id", data.user.id).eq("status", "activo").maybeSingle();
      if (!aliado) {
        await ssr.auth.signOut();
        return NextResponse.json({ error: "Esta cuenta no es de aliado" }, { status: 403 });
      }
      return NextResponse.json({ code: aliado.code, debe_cambiar_clave: aliado.debe_cambiar_clave ?? false });
    }

    // ══ Modo legacy: login por CÉDULA ══
    const { cedula, clave } = body;

    if (!cedula || !clave) {
      return NextResponse.json({ error: "Cédula y clave son requeridos" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: aliado, error } = await supabase
      .from("lanzas")
      .select("id, code, nombre, tipo, clave, debe_cambiar_clave")
      .eq("cedula", cedula.trim())
      .eq("status", "activo")
      .single();

    if (error || !aliado) {
      return NextResponse.json({ error: "Cédula o clave incorrectos" }, { status: 401 });
    }

    // If aliado has no password (old aliados), let them in with just cedula
    if (!aliado.clave) {
      return NextResponse.json({ code: aliado.code, debe_cambiar_clave: false });
    }

    // Verify password
    const isHash = aliado.clave.startsWith("$2");
    const matches = isHash
      ? await bcrypt.compare(clave, aliado.clave)
      : aliado.clave === clave;

    if (!matches) {
      return NextResponse.json({ error: "Cédula o clave incorrectos" }, { status: 401 });
    }

    return NextResponse.json({
      code: aliado.code,
      debe_cambiar_clave: aliado.debe_cambiar_clave ?? false,
    });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
