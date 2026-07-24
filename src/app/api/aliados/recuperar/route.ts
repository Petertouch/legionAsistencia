import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplate } from "@/lib/mail-templates";
import bcrypt from "bcryptjs";

const ALIADO_AUTH = process.env.ALIADO_AUTH_PROVIDER || process.env.NEXT_PUBLIC_ALIADO_AUTH_PROVIDER || "legacy";

export async function POST(request: NextRequest) {
  try {
    const { cedula } = await request.json();

    if (!cedula?.trim()) {
      return NextResponse.json({ error: "Cédula requerida" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: aliado } = await supabase
      .from("lanzas")
      .select("id, nombre, email, code, auth_user_id")
      .eq("cedula", cedula.trim())
      .eq("status", "activo")
      .single();

    if (!aliado) {
      // Don't reveal if cedula exists or not
      return NextResponse.json({ ok: true });
    }

    if (!aliado.email) {
      return NextResponse.json({ error: "No tienes email registrado. Contacta al admin." }, { status: 400 });
    }

    // Generate new temp password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const tempClave = "LJ-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const hashed = await bcrypt.hash(tempClave, 12);

    // Update password
    await supabase
      .from("lanzas")
      .update({ clave: hashed, debe_cambiar_clave: true })
      .eq("id", aliado.id);

    // En modo Supabase Auth: fijar la misma clave temporal en auth.users.
    if (ALIADO_AUTH === "supabase" && aliado.auth_user_id) {
      await supabase.auth.admin.updateUserById(aliado.auth_user_id as string, { password: tempClave }).catch(() => {});
    }

    // Cuerpo desde la BD (mail_templates → "aliado-recuperar").
    await sendTemplate({
      slug: "aliado-recuperar",
      to: aliado.email,
      force: true,
      variables: {
        nombre: aliado.nombre.split(" ")[0],
        clave_temporal: tempClave,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ALIADO RECUPERAR]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
