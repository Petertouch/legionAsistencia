import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const plan = searchParams.get("plan");
    const estado_pago = searchParams.get("estado_pago");
    const orderBy = searchParams.get("orderBy") || "created_at";

    let query = supabase.from("suscriptores").select("*").order(orderBy, { ascending: false });
    if (plan) query = query.eq("plan", plan);
    if (estado_pago) query = query.eq("estado_pago", estado_pago);
    if (search) query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%,telefono.ilike.%${search}%,cedula.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
