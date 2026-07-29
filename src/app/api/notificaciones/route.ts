import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Notificaciones para el usuario logueado (sesión, no API key).
// El middleware inyecta x-user-id (= equipo.id), x-user-role y x-user-email.
//   admin   → casos activos sin asignar
//   abogado → casos nuevos asignados no vistos (verde) + por vencer/vencidos (rojo)
// "No visto" = no existe actividad tipo "vio_caso" del abogado para ese caso;
// al abrir el caso se registra vio_caso, así el "nuevo" se limpia solo.

const CASO_COLS = "id, titulo, suscriptor_nombre, area, etapa, fecha_limite";

interface CasoRow {
  id: string; titulo: string; suscriptor_nombre: string | null;
  area: string | null; etapa: string | null; fecha_limite: string | null;
}
const mapCaso = (c: CasoRow) => ({
  id: c.id, titulo: c.titulo, cliente: c.suscriptor_nombre,
  area: c.area, etapa: c.etapa, fecha_limite: c.fecha_limite,
});

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const role = request.headers.get("x-user-role");

  if (!userId || !role) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // ── ADMIN: casos activos sin asignar ──
  if (role === "admin") {
    const { data } = await supabase
      .from("casos").select(CASO_COLS)
      .is("abogado_id", null)
      .neq("etapa", "Cerrado")
      .order("created_at", { ascending: false });
    const casos = (data || []).map(mapCaso);
    return NextResponse.json({
      rol: "admin",
      total: casos.length,
      sin_asignar: { count: casos.length, casos },
    });
  }

  // ── ABOGADO: nuevos no vistos (verde) + por vencer (rojo) ──
  if (role === "abogado") {
    const [{ data: activos }, { data: vistos }] = await Promise.all([
      supabase.from("casos").select(CASO_COLS).eq("abogado_id", userId).neq("etapa", "Cerrado").order("created_at", { ascending: false }),
      supabase.from("actividad").select("caso_id").eq("actor_id", userId).eq("tipo", "vio_caso"),
    ]);
    const vistosSet = new Set((vistos || []).map((v) => v.caso_id));
    const nuevos = (activos || []).filter((c) => !vistosSet.has(c.id)).map(mapCaso);

    const cutoff = new Date(Date.now() + 2 * 24 * 3600 * 1000); // hoy + 2 días
    const porVencer = (activos || [])
      .filter((c) => c.fecha_limite && new Date(c.fecha_limite) <= cutoff)
      .map(mapCaso);

    return NextResponse.json({
      rol: "abogado",
      total: nuevos.length + porVencer.length,
      nuevos_no_vistos: { count: nuevos.length, casos: nuevos },
      por_vencer: { count: porVencer.length, casos: porVencer },
    });
  }

  // Otros roles (profesor, vendedor): sin notificaciones.
  return NextResponse.json({ rol: role, total: 0 });
}
