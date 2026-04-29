import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: register brochure lead
export async function POST(request: NextRequest) {
  try {
    const { nombre, email } = await request.json();
    if (!nombre?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("brochure_leads")
      .insert({ nombre: nombre.trim(), email: email.trim().toLowerCase() })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// GET: list brochure leads (admin)
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("brochure_leads")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}