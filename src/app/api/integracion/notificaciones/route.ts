import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── API de notificaciones para integración externa (legalaid) ────
// Autenticada por API key (header X-API-Key o Authorization: Bearer), NO por
// la sesión-cookie de Legión. Devuelve, según el email del usuario:
//   admin   → casos activos sin asignar (count + lista)
//   abogado → nuevos no vistos (verde) y por vencer ≤2 días o vencidos (rojo)
//
// GET /api/integracion/notificaciones?email=<email>

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
  // ── Auth por API key ──
  const configured = process.env.NOTIF_API_KEY;
  const provided = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!configured || !provided || provided !== configured) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const email = (new URL(request.url).searchParams.get("email") || "").toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "email requerido" }, { status: 400 });

  const supabase = createAdminClient();

  // Resolver el usuario y su rol por email.
  const { data: miembro } = await supabase
    .from("equipo")
    .select("id, nombre, email, role")
    .ilike("email", email)
    .maybeSingle();

  let rol = miembro?.role as string | undefined;
  if (!miembro) {
    if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.toLowerCase()) rol = "admin";
    else return NextResponse.json({ error: "usuario no encontrado" }, { status: 404 });
  }

  // ── ADMIN: casos activos sin asignar ──
  if (rol === "admin") {
    const { data } = await supabase
      .from("casos").select(CASO_COLS)
      .is("abogado_id", null)
      .neq("etapa", "Cerrado")
      .order("created_at", { ascending: false });
    const casos = (data || []).map(mapCaso);
    return NextResponse.json({ email, rol: "admin", sin_asignar: { count: casos.length, casos } });
  }

  // ── ABOGADO: nuevos no vistos (verde) + por vencer (rojo) ──
  if (rol === "abogado" && miembro) {
    const [{ data: activos }, { data: vistos }] = await Promise.all([
      supabase.from("casos").select(CASO_COLS).eq("abogado_id", miembro.id).neq("etapa", "Cerrado").order("created_at", { ascending: false }),
      supabase.from("actividad").select("caso_id").eq("actor_id", miembro.id).eq("tipo", "vio_caso"),
    ]);
    const vistosSet = new Set((vistos || []).map((v) => v.caso_id));
    const nuevos = (activos || []).filter((c) => !vistosSet.has(c.id)).map(mapCaso);

    const cutoff = new Date(Date.now() + 2 * 24 * 3600 * 1000); // hoy + 2 días
    const porVencer = (activos || [])
      .filter((c) => c.fecha_limite && new Date(c.fecha_limite) <= cutoff)
      .map(mapCaso);

    return NextResponse.json({
      email,
      rol: "abogado",
      nuevos_no_vistos: { count: nuevos.length, casos: nuevos },
      por_vencer: { count: porVencer.length, casos: porVencer },
    });
  }

  // Otros roles (p. ej. profesor): sin notificaciones.
  return NextResponse.json({ email, rol: rol || "desconocido", notificaciones: null });
}
