import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code?.trim()) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find consulta with this code and status "verificando"
    const { data: consulta, error: fetchErr } = await supabase
      .from("consultas_blog")
      .select("id, created_at")
      .eq("codigo", code.trim())
      .eq("status", "verificando")
      .single();

    if (fetchErr || !consulta) {
      return NextResponse.json({ error: "Código inválido o expirado" }, { status: 400 });
    }

    // Check expiration (10 minutes)
    const created = new Date(consulta.created_at).getTime();
    if (Date.now() - created > 10 * 60 * 1000) {
      // Delete expired entry
      await supabase.from("consultas_blog").delete().eq("id", consulta.id);
      return NextResponse.json({ error: "Código expirado. Solicita uno nuevo." }, { status: 400 });
    }

    // Code valid — activate consulta
    const { error: updateErr } = await supabase
      .from("consultas_blog")
      .update({ status: "pendiente", codigo: null })
      .eq("id", consulta.id);

    if (updateErr) {
      return NextResponse.json({ error: "Error al verificar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: consulta.id });
  } catch (err) {
    console.error("[CONSULTA VERIFY]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
