import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: agregados por miembro del equipo para el dashboard/lista.
// Devuelve un mapa { [equipoId]: { activos: [...], cerrados, ultima_actividad, acciones_7d } }.
// La lógica de "estancado"/carga se calcula en el cliente con PIPELINES (config incluida).
export async function GET() {
  try {
    const supabase = createAdminClient();
    const [{ data: equipo }, { data: casos }, { data: actividad }] = await Promise.all([
      supabase.from("equipo").select("id, nombre, role").neq("role", "profesor"),
      supabase.from("casos").select("area, etapa, etapa_index, fecha_ingreso_etapa, abogado, abogado_id"),
      supabase.from("actividad").select("actor_id, created_at"),
    ]);

    const ahora = Date.now();
    const semana = 7 * 24 * 3600 * 1000;
    const out: Record<string, unknown> = {};

    for (const m of equipo || []) {
      const suyos = (casos || []).filter((c) => c.abogado_id === m.id || c.abogado === m.nombre);
      const activos = suyos
        .filter((c) => c.etapa !== "Cerrado")
        .map((c) => ({ area: c.area, etapa: c.etapa, etapa_index: c.etapa_index, fecha_ingreso_etapa: c.fecha_ingreso_etapa }));
      const cerrados = suyos.filter((c) => c.etapa === "Cerrado").length;

      const acts = (actividad || []).filter((a) => a.actor_id === m.id);
      let ultima: string | null = null;
      let acciones7d = 0;
      for (const a of acts) {
        if (!ultima || a.created_at > ultima) ultima = a.created_at;
        if (ahora - new Date(a.created_at).getTime() < semana) acciones7d++;
      }

      out[m.id] = { activos, cerrados, ultima_actividad: ultima, acciones_7d: acciones7d };
    }

    return NextResponse.json(out);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
