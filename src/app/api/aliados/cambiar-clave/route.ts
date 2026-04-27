import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { cedula, clave_actual, clave_nueva } = await request.json();

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
