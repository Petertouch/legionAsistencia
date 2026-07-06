import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: renombra un área legal en todos los casos existentes (from → to).
// La config de pipelines (con la clave renombrada) se guarda por separado.
export async function POST(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { from, to } = await request.json();
  if (!from || !to || typeof from !== "string" || typeof to !== "string" || from === to) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error, count } = await supabase
    .from("casos")
    .update({ area: to }, { count: "exact" })
    .eq("area", from);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, actualizados: count ?? 0 });
}
