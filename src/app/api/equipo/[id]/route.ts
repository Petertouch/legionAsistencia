import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

const PUBLIC_COLS =
  "id, role, nombre, email, telefono, cedula, estado, fecha_ingreso, color, notas, areas_habilitadas, especialidad, max_casos, especialidad_academica, bio, avatar_url, comision_porcentaje, vendedor_code, ciudad, created_at, updated_at";

// PUT: actualizar miembro (incluye cambio de password, que se hashea)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { id: _ignore, created_at, ...updates } = body;

    if (typeof updates.password === "string") {
      updates.password = updates.password ? await bcrypt.hash(updates.password, 12) : "";
    }
    updates.updated_at = new Date().toISOString();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("equipo")
      .update(updates)
      .eq("id", id)
      .select(PUBLIC_COLS)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// DELETE: eliminar miembro
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const { error } = await supabase.from("equipo").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
