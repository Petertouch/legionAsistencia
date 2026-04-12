import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: actualiza el current_step y last_activity_at de un lead.
// Se llama desde /r/[code] cada vez que el usuario avanza al siguiente step,
// para mantener el funnel preciso y permitir el smart-resume.
//
// También permite marcar el lead como "completado" cuando se firma + crea suscriptor,
// y opcionalmente vincularlo a un contrato_id.
//
// Falla silenciosa: si la llamada falla por red u otro motivo, no debe bloquear
// el flujo del usuario en /r/[code]. El frontend ignora errores no críticos.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, current_step, status, contrato_id, datos_extra } = body;

    if (!lead_id) {
      return NextResponse.json({ error: "lead_id requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {
      last_activity_at: new Date().toISOString(),
    };

    if (typeof current_step === "number" && current_step >= 1 && current_step <= 5) {
      updates.current_step = current_step;
    }

    // Reglas de transición de estado:
    // - Si pasa de "nuevo" a step >= 2, marca como "en_proceso"
    // - Si llega a step 5 o se pasa explícitamente status "completado", marca como tal
    // - El status explícito tiene prioridad sobre la inferencia
    if (status && ["nuevo", "en_proceso", "completado"].includes(status)) {
      updates.status = status;
    } else if (typeof current_step === "number" && current_step >= 2) {
      updates.status = "en_proceso";
    }

    if (status === "completado" && contrato_id) {
      updates.contrato_id = contrato_id;
    }

    // Datos extra del step 2 (telefono2, estado_civil, grado, fuerza, unidad,
    // dirección, ciudad, departamento). Se guardan como JSONB para no tener
    // que añadir columnas individuales y poder reanudarlo si abandona.
    if (datos_extra && typeof datos_extra === "object") {
      updates.datos_extra = datos_extra;
    }

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
