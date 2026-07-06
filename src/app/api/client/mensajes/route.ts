import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: escribe un mensaje como cliente. Verifica que el caso sea suyo.
export async function POST(request: NextRequest) {
  try {
    const { caso_id, suscriptor_id, contenido, nombre, archivo_url, archivo_nombre } = await request.json();
    if (!caso_id || !suscriptor_id || (!contenido?.trim() && !archivo_url)) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const supabase = createAdminClient();

    // El caso debe pertenecer al suscriptor.
    const { data: caso } = await supabase.from("casos").select("suscriptor_id").eq("id", caso_id).maybeSingle();
    if (!caso || caso.suscriptor_id !== suscriptor_id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("mensajes")
      .insert({ caso_id, autor_tipo: "cliente", autor_id: suscriptor_id, autor_nombre: nombre || "Cliente", contenido: contenido?.trim() || "", archivo_url: archivo_url || null, archivo_nombre: archivo_nombre || null })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
