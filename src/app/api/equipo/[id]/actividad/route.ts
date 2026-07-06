import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: actividad de un miembro del equipo (por su nombre).
// Devuelve casos asignados, consultas respondidas y documentos subidos.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: miembro } = await supabase
      .from("equipo")
      .select("id, nombre, role, estado, max_casos, especialidad, fecha_ingreso")
      .eq("id", id)
      .maybeSingle();

    if (!miembro) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    const nombre = miembro.nombre;

    const casoCols =
      "id, titulo, area, etapa, etapa_index, prioridad, fecha_limite, fecha_ingreso_etapa, created_at, updated_at, suscriptor_nombre, respondido_por, respondido_at";

    const [asignadosRes, respondidosRes, documentosRes] = await Promise.all([
      supabase.from("casos").select(casoCols).eq("abogado", nombre).order("updated_at", { ascending: false }),
      supabase.from("casos").select("id, titulo, area, suscriptor_nombre, respondido_at").eq("respondido_por", nombre).order("respondido_at", { ascending: false }),
      supabase.from("documentos").select("id, nombre, caso_id, created_at").eq("subido_por", nombre).order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      miembro,
      asignados: asignadosRes.data || [],
      respondidos: respondidosRes.data || [],
      documentos: documentosRes.data || [],
    });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
