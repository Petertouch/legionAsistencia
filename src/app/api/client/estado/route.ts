import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/client/estado?cedula=123
// Lightweight endpoint to check current estado_pago
export async function GET(request: NextRequest) {
  try {
    const cedula = new URL(request.url).searchParams.get("cedula");
    if (!cedula) return NextResponse.json({ error: "cedula requerida" }, { status: 400 });

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("suscriptores")
      .select("estado_pago")
      .eq("cedula", cedula.trim())
      .single();

    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json({ estado_pago: data.estado_pago });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
