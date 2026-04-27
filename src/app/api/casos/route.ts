import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: list/search cases
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const area = searchParams.get("area");
    const etapa = searchParams.get("etapa");
    const prioridad = searchParams.get("prioridad");
    const abogado = searchParams.get("abogado");
    const suscriptor_id = searchParams.get("suscriptor_id");

    let query = supabase.from("casos").select("*").order("created_at", { ascending: false });
    if (area) query = query.eq("area", area);
    if (etapa) query = query.eq("etapa", etapa);
    if (prioridad) query = query.eq("prioridad", prioridad);
    if (abogado) query = query.eq("abogado", abogado);
    if (suscriptor_id) query = query.eq("suscriptor_id", suscriptor_id);
    if (search) query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%,suscriptor_nombre.ilike.%${search}%,abogado.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// POST: create case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suscriptor_id, area, titulo, prioridad, abogado, descripcion, fecha_limite, etapa, etapa_index } = body;

    if (!suscriptor_id || !area || !titulo || !abogado) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get suscriptor name
    const { data: sus } = await supabase.from("suscriptores").select("nombre").eq("id", suscriptor_id).single();

    const { data, error } = await supabase
      .from("casos")
      .insert({
        suscriptor_id,
        suscriptor_nombre: sus?.nombre || null,
        area,
        titulo,
        etapa: etapa || "Recepcion",
        etapa_index: etapa_index ?? 0,
        prioridad: prioridad || "normal",
        abogado,
        descripcion: descripcion || "",
        fecha_limite: fecha_limite || null,
        checklist: {},
        notas_etapa: "",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// PUT: update case (advance, move, checklist, etc)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("casos")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
