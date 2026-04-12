import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getRole(request: NextRequest): string | null {
  return request.headers.get("x-user-role");
}

// GET: list contratos with identity data (admin only)
export async function GET(request: NextRequest) {
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  const supabase = createAdminClient();

  if (id) {
    // Single contrato detail
    const { data, error } = await supabase
      .from("contratos")
      .select("id, nombre, cedula, email, telefono, plan, foto_data, cedula_frente_data, cedula_reverso_data, created_at, identidad_status, identidad_notas")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // List all
  const { data, error } = await supabase
    .from("contratos")
    .select("id, nombre, cedula, email, telefono, plan, foto_data, cedula_frente_data, cedula_reverso_data, created_at, identidad_status, identidad_notas")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// PATCH: update identity status
export async function PATCH(request: NextRequest) {
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id, identidad_status, identidad_notas } = await request.json();
  if (!id || !identidad_status) {
    return NextResponse.json({ error: "ID y status requeridos" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = { identidad_status };
  if (identidad_notas !== undefined) updates.identidad_notas = identidad_notas;

  const { error } = await supabase.from("contratos").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
