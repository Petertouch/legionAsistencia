import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

// GET: mensajes de un caso (?caso_id=). Lectura abierta (caso_id es un UUID).
export async function GET(request: NextRequest) {
  const casoId = new URL(request.url).searchParams.get("caso_id");
  if (!casoId) return NextResponse.json({ error: "caso_id requerido" }, { status: 400 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mensajes")
    .select("*")
    .eq("caso_id", casoId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST: escribe un mensaje como miembro del equipo. Solo el abogado puede escribir;
// el administrador únicamente puede ver (403).
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.role !== "abogado") {
    return NextResponse.json({ error: "El administrador solo puede ver el chat, no escribir." }, { status: 403 });
  }
  try {
    const { caso_id, contenido, archivo_url, archivo_nombre } = await request.json();
    if (!caso_id || (!contenido?.trim() && !archivo_url)) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("mensajes")
      .insert({ caso_id, autor_tipo: "abogado", autor_id: session.id, autor_nombre: session.nombre, contenido: contenido?.trim() || "", archivo_url: archivo_url || null, archivo_nombre: archivo_nombre || null })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
