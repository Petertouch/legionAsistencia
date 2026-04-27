import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/lanza-leads/buscar?cedula=123&telefono=456
// Returns lead data if there's one "en proceso" (not a suscriptor yet)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cedula = searchParams.get("cedula")?.trim();
    const telefono = searchParams.get("telefono")?.trim();

    if (!cedula && !telefono) {
      return NextResponse.json(null);
    }

    const supabase = createAdminClient();

    // Check if already a suscriptor — if so, don't return anything
    if (cedula) {
      const { data: sus } = await supabase.from("suscriptores").select("id").eq("cedula", cedula).maybeSingle();
      if (sus) return NextResponse.json(null);
    }

    // Search for lead in process
    const enProcesoStatuses = ["nuevo", "en_proceso", "contactado", "abandonado"];

    let query = supabase
      .from("lanza_leads")
      .select("id, nombre, telefono, email, cedula, plan_interes, datos_extra, current_step, status")
      .in("status", enProcesoStatuses)
      .order("created_at", { ascending: false })
      .limit(1);

    if (cedula) {
      query = query.eq("cedula", cedula);
    } else if (telefono) {
      query = query.eq("telefono", telefono);
    }

    const { data } = await query.maybeSingle();

    if (!data) return NextResponse.json(null);

    return NextResponse.json({
      lead_id: data.id,
      nombre: data.nombre || "",
      telefono: data.telefono || "",
      email: data.email || "",
      cedula: data.cedula || "",
      plan_interes: data.plan_interes || "",
      datos_extra: data.datos_extra || null,
      current_step: data.current_step || 1,
    });
  } catch {
    return NextResponse.json(null);
  }
}
