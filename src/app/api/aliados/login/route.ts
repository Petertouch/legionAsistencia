import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { cedula, clave } = await request.json();

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
