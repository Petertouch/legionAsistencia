import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validatePassword } from "@/lib/password";
import { updateStaffAuthUser, deleteStaffAuthUser } from "@/lib/supabase/auth-sync";
import bcrypt from "bcryptjs";

const AUTH_PROVIDER = process.env.AUTH_PROVIDER || "legacy";

const PUBLIC_COLS =
  "id, role, nombre, email, telefono, cedula, estado, fecha_ingreso, color, notas, areas_habilitadas, especialidad, max_casos, especialidad_academica, bio, avatar_url, comision_porcentaje, vendedor_code, ciudad, created_at, updated_at";

// PUT: actualizar miembro (incluye cambio de password, que se hashea)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { id: _ignore, created_at, ...updates } = body;

    // Guardar la contraseña en claro (para sincronizar con Supabase Auth) antes de hashearla.
    const plainPassword =
      typeof updates.password === "string" && updates.password ? updates.password : null;

    if (typeof updates.password === "string") {
      if (updates.password) {
        const pwError = validatePassword(updates.password);
        if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });
        updates.password = await bcrypt.hash(updates.password, 12);
      } else {
        updates.password = "";
      }
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

    // En modo Supabase Auth: espejar email / password / rol / nombre en auth.users.
    if (AUTH_PROVIDER === "supabase") {
      const { data: row } = await supabase
        .from("equipo")
        .select("auth_user_id")
        .eq("id", id)
        .maybeSingle();
      if (row?.auth_user_id) {
        await updateStaffAuthUser(row.auth_user_id as string, {
          email: typeof updates.email === "string" ? updates.email : undefined,
          password: plainPassword || undefined,
          role: typeof updates.role === "string" ? updates.role : undefined,
          nombre: typeof updates.nombre === "string" ? updates.nombre : undefined,
        });
      }
    }

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

    // Capturar el auth_user_id antes de borrar la fila, para limpiar auth.users.
    let authUserId: string | null = null;
    if (AUTH_PROVIDER === "supabase") {
      const { data: row } = await supabase
        .from("equipo")
        .select("auth_user_id")
        .eq("id", id)
        .maybeSingle();
      authUserId = (row?.auth_user_id as string) || null;
    }

    const { error } = await supabase.from("equipo").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (authUserId) await deleteStaffAuthUser(authUserId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
