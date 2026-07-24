import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

const CLIENT_AUTH = process.env.CLIENT_AUTH_PROVIDER || process.env.NEXT_PUBLIC_CLIENT_AUTH_PROVIDER || "legacy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ══ Modo Supabase Auth: verificar por email + updateUser ══
    if (CLIENT_AUTH === "supabase") {
      const email = (body.email || "").toLowerCase().trim();
      const { clave_actual, clave_nueva } = body;
      if (!email || !clave_actual || !clave_nueva) {
        return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
      }
      if (clave_nueva.length < 8) {
        return NextResponse.json({ error: "La nueva clave debe tener al menos 8 caracteres" }, { status: 400 });
      }
      // Verificar la clave actual re-autenticando
      const ssr = await createServerSupabase();
      const { data, error } = await ssr.auth.signInWithPassword({ email, password: clave_actual });
      if (error || !data.user) {
        return NextResponse.json({ error: "La clave actual es incorrecta" }, { status: 401 });
      }
      const admin = createAdminClient();
      const { error: upErr } = await admin.auth.admin.updateUserById(data.user.id, { password: clave_nueva });
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      // Mantener suscriptores.clave en sync (chat-auth aún la usa) + bajar la bandera.
      const hashedNueva = await bcrypt.hash(clave_nueva, 12);
      await admin.from("suscriptores").update({ clave: hashedNueva, debe_cambiar_clave: false }).eq("auth_user_id", data.user.id);
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
    const { data: suscriptor, error } = await supabase
      .from("suscriptores")
      .select("id, clave")
      .eq("cedula", cedula.trim())
      .single();

    if (error || !suscriptor || !suscriptor.clave) {
      return NextResponse.json({ error: "Suscriptor no encontrado" }, { status: 404 });
    }

    // Verify current password
    const isHash = suscriptor.clave.startsWith("$2");
    const matches = isHash
      ? await bcrypt.compare(clave_actual, suscriptor.clave)
      : suscriptor.clave === clave_actual;

    if (!matches) {
      return NextResponse.json({ error: "La clave actual es incorrecta" }, { status: 401 });
    }

    // Hash new password and update
    const hashedNueva = await bcrypt.hash(clave_nueva, 12);
    const { error: updateErr } = await supabase
      .from("suscriptores")
      .update({ clave: hashedNueva, debe_cambiar_clave: false })
      .eq("id", suscriptor.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
