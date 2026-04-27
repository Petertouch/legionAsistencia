import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/aliados/leads?lanza_id=X&filter=todos|en_proceso|convertidos|abandonados|descartados&page=0&limit=10
// GET /api/aliados/leads?lanza_id=X&counts=true  (returns only counts per status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lanzaId = searchParams.get("lanza_id");
    if (!lanzaId) return NextResponse.json({ error: "lanza_id requerido" }, { status: 400 });

    const supabase = createAdminClient();

    // Counts mode
    if (searchParams.get("counts") === "true") {
      const { data, error } = await supabase
        .from("lanza_leads")
        .select("status")
        .eq("lanza_id", lanzaId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const leads = data || [];
      const enProceso = ["nuevo", "en_proceso", "contactado"];
      const firmados = ["firmado", "completado"];
      const convertidos = ["convertido"];
      const abandonados = ["abandonado"];
      const descartados = ["descartado", "perdido"];

      return NextResponse.json({
        total: leads.length,
        en_proceso: leads.filter((l) => enProceso.includes(l.status)).length,
        firmados: leads.filter((l) => firmados.includes(l.status)).length,
        convertidos: leads.filter((l) => convertidos.includes(l.status)).length,
        abandonados: leads.filter((l) => abandonados.includes(l.status)).length,
        descartados: leads.filter((l) => descartados.includes(l.status)).length,
      });
    }

    // Paginated list mode
    const filter = searchParams.get("filter") || "todos";
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = page * limit;

    let query = supabase
      .from("lanza_leads")
      .select("id, nombre, telefono, email, cedula, area_interes, plan_interes, status, current_step, last_activity_at, created_at")
      .eq("lanza_id", lanzaId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filter
    if (filter === "en_proceso") {
      query = query.in("status", ["nuevo", "en_proceso", "contactado"]);
    } else if (filter === "firmados") {
      query = query.in("status", ["firmado", "completado"]);
    } else if (filter === "convertidos") {
      query = query.eq("status", "convertido");
    } else if (filter === "abandonados") {
      query = query.eq("status", "abandonado");
    } else if (filter === "descartados") {
      query = query.in("status", ["descartado", "perdido"]);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
