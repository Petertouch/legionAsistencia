import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth check (inyectado por middleware) ──
  const userRole = request.headers.get("x-user-role");
  if (!userRole || !["admin", "abogado"].includes(userRole)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const updates = await request.json();

  // Solo permitir campos seguros
  const allowed = ["estado_pago", "plan", "nombre", "telefono", "email", "cedula", "rama", "rango", "notas"];
  const safeUpdates: Record<string, unknown> = {};
  for (const key of Object.keys(updates)) {
    if (allowed.includes(key)) safeUpdates[key] = updates[key];
  }

  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: "No hay campos válidos para actualizar" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("suscriptores")
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
