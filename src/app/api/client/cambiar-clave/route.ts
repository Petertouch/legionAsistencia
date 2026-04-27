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
