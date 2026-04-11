import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: get client's own contrato by cedula
export async function GET(request: NextRequest) {
  const cedula = request.nextUrl.searchParams.get("cedula");

  if (!cedula) {
    return NextResponse.json({ error: "Cédula requerida" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contratos")
    .select("*")
    .eq("cedula", cedula.trim())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json(null);
  }

  return NextResponse.json(data);
}
