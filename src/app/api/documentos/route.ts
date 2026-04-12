import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getRole(request: NextRequest): string | null {
  return request.headers.get("x-user-role");
}

// GET: list documents by caso_id
export async function GET(request: NextRequest) {
  const role = getRole(request);
  if (!role || !["admin", "abogado"].includes(role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const casoId = request.nextUrl.searchParams.get("caso_id");
  const suscriptorId = request.nextUrl.searchParams.get("suscriptor_id");

  const supabase = createAdminClient();
  let query = supabase.from("documentos").select("*").order("created_at", { ascending: false });

  if (casoId) query = query.eq("caso_id", casoId);
  if (suscriptorId) query = query.eq("suscriptor_id", suscriptorId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST: create document
export async function POST(request: NextRequest) {
  const role = getRole(request);
  if (!role || !["admin", "abogado"].includes(role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { suscriptor_id, caso_id, nombre, tipo, archivo_url, tamano, subido_por } = body;

  if (!nombre || !archivo_url) {
    return NextResponse.json({ error: "Nombre y archivo requeridos" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documentos")
    .insert({ suscriptor_id, caso_id, nombre, tipo: tipo || "otro", archivo_url, tamano, subido_por })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: remove document by id (admin only)
export async function DELETE(request: NextRequest) {
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "Solo admin puede eliminar documentos" }, { status: 403 });
  }

  const docId = request.nextUrl.searchParams.get("id");
  if (!docId) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("documentos").delete().eq("id", docId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
