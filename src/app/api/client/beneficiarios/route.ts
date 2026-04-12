import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: listar beneficiarios del suscriptor
export async function GET(request: NextRequest) {
  const suscriptorId = request.nextUrl.searchParams.get("suscriptor_id");
  if (!suscriptorId) {
    return NextResponse.json({ error: "suscriptor_id requerido" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("beneficiarios")
    .select("*")
    .eq("suscriptor_id", suscriptorId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

const PARENTESCOS = ["Cónyuge", "Hijo(a)", "Padre", "Madre", "Hermano(a)"];

// POST: pre-registrar un familiar (queda inactivo hasta que se apruebe la cuenta)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suscriptor_id, nombre, parentesco, cedula, email, telefono } = body;

    if (!suscriptor_id || !nombre || !parentesco || !cedula) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (!PARENTESCOS.includes(parentesco)) {
      return NextResponse.json({ error: "Parentesco inválido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verificar que el suscriptor existe
    const { data: sus } = await supabase
      .from("suscriptores")
      .select("id, estado_pago")
      .eq("id", suscriptor_id)
      .single();

    if (!sus) {
      return NextResponse.json({ error: "Suscriptor no encontrado" }, { status: 404 });
    }

    // Check duplicado por cédula dentro del mismo suscriptor
    const { data: existing } = await supabase
      .from("beneficiarios")
      .select("id")
      .eq("suscriptor_id", suscriptor_id)
      .eq("cedula", cedula.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ya tienes un familiar registrado con esta cédula" },
        { status: 409 }
      );
    }

    // Si la cuenta ya está aprobada ("Al dia"), el beneficiario se activa de una vez.
    // Si está "Pendiente", queda inactivo hasta que un admin apruebe la cuenta.
    const activo = sus.estado_pago === "Al dia";

    const { data, error } = await supabase
      .from("beneficiarios")
      .insert({
        suscriptor_id,
        nombre: nombre.trim(),
        parentesco,
        cedula: cedula.trim(),
        email: email?.trim() || null,
        telefono: telefono?.trim() || null,
        activo,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: eliminar un beneficiario
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const suscriptorId = request.nextUrl.searchParams.get("suscriptor_id");

  if (!id || !suscriptorId) {
    return NextResponse.json({ error: "id y suscriptor_id requeridos" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verificar propiedad
  const { data: ben } = await supabase
    .from("beneficiarios")
    .select("id, suscriptor_id")
    .eq("id", id)
    .eq("suscriptor_id", suscriptorId)
    .single();

  if (!ben) {
    return NextResponse.json({ error: "Familiar no encontrado" }, { status: 404 });
  }

  const { error } = await supabase.from("beneficiarios").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
