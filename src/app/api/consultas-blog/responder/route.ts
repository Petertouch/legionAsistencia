import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";

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

    // Send response email
    try {
      await sendMail({
        to: consulta.email,
        subject: "Respuesta a tu consulta legal — Legión Jurídica",
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #1a1a1a; font-size: 20px; margin: 0;">Legión Jurídica</h1>
              <p style="color: #888; font-size: 13px; margin: 4px 0 0;">Respuesta a tu consulta</p>
            </div>

            <p style="color: #555; font-size: 14px;">Hola <strong>${consulta.nombre}</strong>,</p>
            <p style="color: #555; font-size: 14px;">Nuestro equipo jurídico ha respondido tu consulta:</p>

            <div style="background: #f0f0ee; border-left: 3px solid #999; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #888; font-size: 12px; margin: 0 0 4px; font-weight: 600;">Tu pregunta:</p>
              <p style="color: #555; font-size: 13px; margin: 0; font-style: italic;">"${consulta.pregunta}"</p>
            </div>

            <div style="background: #f8f7f4; border-left: 3px solid #d4a843; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #888; font-size: 12px; margin: 0 0 4px; font-weight: 600;">Respuesta de ${respondido_por.trim()}:</p>
              <p style="color: #333; font-size: 14px; margin: 0; line-height: 1.6;">${respuesta.trim().replace(/\n/g, "<br>")}</p>
            </div>

            <div style="background: #fffbeb; border: 1px solid #f5e6b8; border-radius: 8px; padding: 12px 16px; margin: 20px 0;">
              <p style="color: #92740c; font-size: 11px; margin: 0;">
                <strong>Nota:</strong> Esta respuesta es orientativa y no constituye asesoría legal formal.
                Para una asesoría completa y seguimiento de tu caso, te invitamos a conocer nuestros planes de suscripción.
              </p>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="https://legionjuridica.com/#planes" style="background: #1a1a1a; color: #d4a843; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block;">
                Conocer planes de Legión Jurídica
              </a>
            </div>

            <p style="color: #ccc; font-size: 10px; text-align: center; margin-top: 32px;">
              © Legión Jurídica · legionjuridica.com
            </p>
          </div>
        `,
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
