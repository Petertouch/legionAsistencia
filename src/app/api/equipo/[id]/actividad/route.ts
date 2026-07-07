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

    const [asigId, asigNombre, respondidosRes, documentosRes, consultasRes] = await Promise.all([
      supabase.from("casos").select(casoCols).eq("abogado_id", id).order("updated_at", { ascending: false }),
      supabase.from("casos").select(casoCols).eq("abogado", nombre).order("updated_at", { ascending: false }),
      supabase.from("casos").select("id, titulo, area, suscriptor_nombre, respondido_at").eq("respondido_por", nombre).order("respondido_at", { ascending: false }),
      supabase.from("documentos").select("id, nombre, caso_id, created_at").eq("subido_por", nombre).order("created_at", { ascending: false }),
      supabase.from("consultas_blog").select("id, nombre, apellido, area, pregunta, respondido_at").eq("respondido_por", nombre).order("respondido_at", { ascending: false }),
    ]);

    // Une por abogado_id (confiable) y por nombre (respaldo para casos sin migrar), sin duplicar.
    const mapa = new Map<string, Record<string, unknown>>();
    for (const c of [...(asigId.data || []), ...(asigNombre.data || [])]) mapa.set(c.id as string, c);
    const asignados = [...mapa.values()].sort(
      (a, b) => new Date(b.updated_at as string).getTime() - new Date(a.updated_at as string).getTime()
    );

    return NextResponse.json({
      miembro,
      asignados,
      respondidos: respondidosRes.data || [],
      documentos: documentosRes.data || [],
      consultas_gratuitas: consultasRes.data || [],
    });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
