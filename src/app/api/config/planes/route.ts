import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: read planes from active contrato_plantilla
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("contrato_plantilla")
      .select("planes")
      .eq("activo", true)
      .single();

    return NextResponse.json(data?.planes || []);
  } catch {
    return NextResponse.json([]);
  }
}

// POST: update planes in active contrato_plantilla (single source of truth)
export async function POST(request: NextRequest) {
  try {
    const { planes } = await request.json();
    if (!planes || !Array.isArray(planes)) {
      return NextResponse.json({ error: "planes requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Update planes in the active plantilla
    const { error } = await supabase
      .from("contrato_plantilla")
      .update({ planes, updated_at: new Date().toISOString() })
      .eq("activo", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
