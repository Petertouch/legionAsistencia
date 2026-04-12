import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getRole(request: NextRequest): string | null {
  return request.headers.get("x-user-role");
}

// GET: get active plantilla
export async function GET(request: NextRequest) {
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contrato_plantilla")
    .select("*")
    .eq("activo", true)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: save new plantilla (deactivate old one)
export async function POST(request: NextRequest) {
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = createAdminClient();

  // Deactivate old
  await supabase.from("contrato_plantilla").update({ activo: false }).eq("activo", true);

  // Insert new
  const { data, error } = await supabase
    .from("contrato_plantilla")
    .insert({ ...body, activo: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
