import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validatePassword } from "@/lib/password";
import bcrypt from "bcryptjs";

// Columnas seguras para devolver al cliente (nunca el password).
const PUBLIC_COLS =
  "id, role, nombre, email, telefono, cedula, estado, fecha_ingreso, color, notas, areas_habilitadas, especialidad, max_casos, especialidad_academica, bio, avatar_url, comision_porcentaje, vendedor_code, ciudad, created_at, updated_at";

// GET: lista de miembros (opcional ?role=abogado|profesor)
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const role = new URL(request.url).searchParams.get("role");
    let query = supabase.from("equipo").select(PUBLIC_COLS).order("created_at", { ascending: true });
    if (role) query = query.eq("role", role);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// POST: crear miembro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, created_at, updated_at, password, ...rest } = body;

    if (!rest.nombre || !rest.email) {
      return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const insert: Record<string, unknown> = { ...rest };
    if (password) {
      const pwError = validatePassword(password);
      if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });
      insert.password = await bcrypt.hash(password, 12);
    }

    const { data, error } = await supabase
      .from("equipo")
      .insert(insert)
      .select(PUBLIC_COLS)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
