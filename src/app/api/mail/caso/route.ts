import { NextRequest, NextResponse } from "next/server";
import { sendTemplate } from "@/lib/mail-templates";
import { createAdminClient } from "@/lib/supabase/admin";

// Notificaciones de caso (caso-creado / caso-avanzo / caso-cerrado).
// El cuerpo sale de la BD (mail_templates); aquí solo se resuelve el destinatario.
export async function POST(request: NextRequest) {
  try {
    const { slug, to, suscriptor_id, variables } = await request.json();

    // Resolver email: directo o por suscriptor_id
    let email = to;
    let nombre = variables?.nombre || "";
    if (!email && suscriptor_id) {
      const supabase = createAdminClient();
      const { data } = await supabase.from("suscriptores").select("email, nombre").eq("id", suscriptor_id).single();
      if (data?.email) {
        email = data.email;
        if (!nombre) nombre = data.nombre;
      }
    }

    if (!slug || !email) {
      return NextResponse.json({ error: "slug y email requeridos" }, { status: 400 });
    }

    const vars = { ...(variables || {}) };
    if (nombre && !vars.nombre) vars.nombre = nombre;

    const sent = await sendTemplate({ slug, to: email, variables: vars });
    return NextResponse.json({ ok: sent });
  } catch (err) {
    console.error("[CASO MAIL]", err);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
