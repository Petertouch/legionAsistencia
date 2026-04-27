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

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

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

  // When admin approves (estado_pago → "Al dia"), convert the associated lead to "convertido"
  if (safeUpdates.estado_pago === "Al dia" && data?.cedula) {
    try {
      await supabase
        .from("lanza_leads")
        .update({ status: "convertido" })
        .eq("cedula", data.cedula)
        .in("status", ["firmado", "completado"]);
    } catch { /* silent */ }
  }

  return NextResponse.json(data);
}
