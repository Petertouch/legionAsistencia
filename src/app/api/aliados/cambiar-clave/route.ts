import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

const ALIADO_AUTH = process.env.ALIADO_AUTH_PROVIDER || process.env.NEXT_PUBLIC_ALIADO_AUTH_PROVIDER || "legacy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ══ Modo Supabase Auth: verificar por email + updateUser ══
    if (ALIADO_AUTH === "supabase") {
      const email = (body.email || "").toLowerCase().trim();
      const { clave_actual, clave_nueva } = body;
      if (!email || !clave_actual || !clave_nueva) {
        return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
      }
      if (clave_nueva.length < 8) {
        return NextResponse.json({ error: "La nueva clave debe tener al menos 8 caracteres" }, { status: 400 });
      }
      const ssr = await createServerSupabase();
      const { data, error } = await ssr.auth.signInWithPassword({ email, password: clave_actual });
      if (error || !data.user) {
        return NextResponse.json({ error: "Clave actual incorrecta" }, { status: 401 });
      }
      const admin = createAdminClient();
      const { error: upErr } = await admin.auth.admin.updateUserById(data.user.id, { password: clave_nueva });
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      const hashed = await bcrypt.hash(clave_nueva, 12);
      await admin.from("lanzas").update({ clave: hashed, debe_cambiar_clave: false }).eq("auth_user_id", data.user.id);
      return NextResponse.json({ ok: true });
    }

    // ══ Modo legacy: por cédula ══
    const { cedula, clave_actual, clave_nueva } = body;

    if (!cedula || !clave_actual || !clave_nueva) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    if (clave_nueva.length < 8) {
      return NextResponse.json({ error: "La nueva clave debe tener al menos 8 caracteres" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: aliado } = await supabase
      .from("lanzas")
      .select("id, clave")
      .eq("cedula", cedula.trim())
      .single();

    if (!aliado || !aliado.clave) {
      return NextResponse.json({ error: "Aliado no encontrado" }, { status: 404 });
    }

    const isHash = aliado.clave.startsWith("$2");
    const matches = isHash
      ? await bcrypt.compare(clave_actual, aliado.clave)
      : aliado.clave === clave_actual;

    if (!matches) {
      return NextResponse.json({ error: "Clave actual incorrecta" }, { status: 401 });
    }

    const hashed = await bcrypt.hash(clave_nueva, 12);
    await supabase
      .from("lanzas")
      .update({ clave: hashed, debe_cambiar_clave: false })
      .eq("id", aliado.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
