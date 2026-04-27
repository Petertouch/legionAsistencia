import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/referidores/leads?referidor_id=X&year=2026&month=3
// GET /api/referidores/leads?all=true  (for initial store load, returns all leads)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = createAdminClient();

    // All leads (for store fetchAll)
    if (searchParams.get("all") === "true") {
      const { data, error } = await supabase
        .from("lanza_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data || []);
    }

    const referidorId = searchParams.get("referidor_id");
    const code = searchParams.get("code");
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth()));

    if (!referidorId && !code) {
      return NextResponse.json({ error: "referidor_id o code requerido" }, { status: 400 });
    }

    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 1).toISOString();

    let query = supabase
      .from("lanza_leads")
      .select("*")
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .order("created_at", { ascending: false });

    if (referidorId) {
      query = query.eq("lanza_id", referidorId);
    }
    if (code) {
      query = query.eq("lanza_code", code);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
