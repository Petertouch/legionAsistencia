import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: Permite al aliado dueño del lead (o a un admin) marcar manualmente
// el estado de un lead. Útil para que el aliado actúe sobre su pipeline:
// - "contactado": ya lo llamó pero no ha cerrado
// - "descartado": el cliente dijo que no le interesa
// - "abandonado": el cliente no responde después de varios intentos
//
// Validación: requiere el lanza_code del aliado en el body como prueba de propiedad.
// El admin puede saltarse esto enviando un header x-user-role=admin (vía middleware),
// pero por simplicidad esta primera versión solo permite al aliado dueño.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, lanza_code, status } = body;

    if (!lead_id || !lanza_code || !status) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const allowed = ["contactado", "descartado", "abandonado", "en_proceso"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verifica propiedad: el lead debe pertenecer al aliado que tiene este lanza_code
    const { data: lead } = await supabase
      .from("lanza_leads")
      .select("id, lanza_code")
      .eq("id", lead_id)
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    // First-touch: solo el aliado original puede marcar
    if (lead.lanza_code !== lanza_code) {
      return NextResponse.json(
        { error: "No tienes permisos sobre este lead" },
        { status: 403 }
      );
    }

    const updates: Record<string, unknown> = {
      status,
      last_activity_at: new Date().toISOString(),
    };
    if (status === "abandonado") updates.abandonado_at = new Date().toISOString();
    if (status === "descartado") updates.descartado_at = new Date().toISOString();

    const { error } = await supabase
      .from("lanza_leads")
      .update(updates)
      .eq("id", lead_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
