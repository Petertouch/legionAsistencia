import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

// PUT: el admin fija/reinicia la clave de acceso del suscriptor (cliente).
// El cliente inicia sesión con su cédula + esta clave.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRole = request.headers.get("x-user-role");
  if (userRole !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { clave, debe_cambiar_clave } = await request.json();
  if (typeof clave !== "string" || clave.trim().length < 6) {
    return NextResponse.json({ error: "La clave debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(clave.trim(), 12);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("suscriptores")
    .update({ clave: hashed, debe_cambiar_clave: Boolean(debe_cambiar_clave), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, nombre, cedula, debe_cambiar_clave")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ...data });
}
