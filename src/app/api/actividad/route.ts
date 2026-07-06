import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: registra una acción del usuario actual (el actor viene de la sesión).
export async function POST(request: NextRequest) {
  const actorId = request.headers.get("x-user-id");
  const actorRole = request.headers.get("x-user-role");
  const actorNombre = decodeURIComponent(request.headers.get("x-user-nombre") || "");
  if (!actorId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { caso_id, tipo, detalle } = await request.json();
    if (!tipo) return NextResponse.json({ error: "tipo requerido" }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase.from("actividad").insert({
      actor_id: actorId,
      actor_nombre: actorNombre || null,
      actor_role: actorRole || null,
      caso_id: caso_id || null,
      tipo,
      detalle: detalle || null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// GET: actividad por actor (?actor_id=) o por caso (?caso_id=).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actorId = searchParams.get("actor_id");
    const casoId = searchParams.get("caso_id");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

    const supabase = createAdminClient();
    let query = supabase.from("actividad").select("*").order("created_at", { ascending: false }).limit(limit);
    if (actorId) query = query.eq("actor_id", actorId);
    if (casoId) query = query.eq("caso_id", casoId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
