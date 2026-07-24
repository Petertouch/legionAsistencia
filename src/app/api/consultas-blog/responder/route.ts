import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplate } from "@/lib/mail-templates";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { consulta_id, respuesta, respondido_por } = await request.json();

    if (!consulta_id || !respuesta?.trim() || !respondido_por?.trim()) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get consulta
    const { data: consulta, error: fetchErr } = await supabase
      .from("consultas_blog")
      .select("*")
      .eq("id", consulta_id)
      .single();

    if (fetchErr || !consulta) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    // Update consulta
    const { error: updateErr } = await supabase
      .from("consultas_blog")
      .update({
        respuesta: respuesta.trim(),
        respondido_por: respondido_por.trim(),
        respondido_at: new Date().toISOString(),
        status: "respondida",
      })
      .eq("id", consulta_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Registrar en el audit log (actor de la sesión).
    try {
      const session = await getSession();
      if (session) {
        await supabase.from("actividad").insert({
          actor_id: session.id, actor_nombre: session.nombre, actor_role: session.role,
          caso_id: null, tipo: "respondio_consulta_gratuita",
          detalle: (consulta.pregunta || "").slice(0, 60),
        });
      }
    } catch { /* no bloquea la respuesta */ }

    // Cuerpo desde la BD (mail_templates → "consulta-blog-respuesta").
    try {
      await sendTemplate({
        slug: "consulta-blog-respuesta",
        to: consulta.email,
        force: true,
        variables: {
          nombre: consulta.nombre,
          pregunta: consulta.pregunta || "",
          respuesta: respuesta.trim().replace(/\n/g, "<br>"),
          respondido_por: respondido_por.trim(),
        },
      });

      // Mark email as sent
      await supabase
        .from("consultas_blog")
        .update({ email_enviado: true })
        .eq("id", consulta_id);

    } catch (mailErr) {
      console.error("[CONSULTA MAIL]", mailErr);
      // Don't fail the response if email fails
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[CONSULTA RESPOND]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
