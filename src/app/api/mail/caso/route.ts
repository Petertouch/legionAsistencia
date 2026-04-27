import { NextRequest, NextResponse } from "next/server";
import { sendMail, renderTemplate } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";

// Hardcoded case email templates (same as mail-store but server-side)
const TEMPLATES: Record<string, { asunto: string; html: string }> = {
  "caso-creado": {
    asunto: "Se ha abierto un nuevo caso: {{titulo_caso}}",
    html: `<div style="max-width:560px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif">
      <div style="background:#1a1a1a;border-radius:12px 12px 0 0;padding:28px;text-align:center;border-bottom:3px solid #C8A96E">
        <img src="https://legionjuridica.com/images/logo.svg" width="40" height="40" style="display:block;margin:0 auto 10px" />
        <h1 style="margin:0;font-size:16px;color:#C8A96E;letter-spacing:2px">NUEVO CASO ABIERTO</h1>
      </div>
      <div style="background:#fff;padding:28px 32px">
        <h2 style="margin:0 0 8px;font-size:18px;color:#1a1a1a">Hola, {{nombre}}</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6">Se ha registrado un nuevo caso legal a tu nombre. Tu abogado ya está trabajando en él.</p>
        <div style="background:#f8f7f4;border:1px solid #e5e2da;border-radius:10px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 4px;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px">Caso</p>
          <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a;font-weight:bold">{{titulo_caso}}</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><p style="margin:0;font-size:10px;color:#999;text-transform:uppercase">Área</p><p style="margin:2px 0 0;font-size:13px;color:#1a1a1a;font-weight:600">{{area}}</p></td>
            <td style="text-align:right"><p style="margin:0;font-size:10px;color:#999;text-transform:uppercase">Abogado</p><p style="margin:2px 0 0;font-size:13px;color:#1a1a1a;font-weight:600">{{abogado}}</p></td>
          </tr></table>
          <div style="border-top:1px solid #e5e2da;margin-top:12px;padding-top:10px"><p style="margin:0;font-size:14px;color:#3b82f6;font-weight:600">📂 En proceso</p></div>
        </div>
        <p style="margin:0 0 20px;font-size:13px;color:#777;line-height:1.5">Te mantendremos informado sobre cada avance. Recibirás un email cada vez que tu caso avance de etapa.</p>
        <div style="text-align:center"><a href="https://legionjuridica.com/mi-caso" style="display:inline-block;padding:12px 32px;background:#1a1a1a;color:#C8A96E;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px">Ver mi caso</a></div>
      </div>
      <div style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;border-top:1px solid #eee"><p style="margin:0;font-size:10px;color:#ccc">Legión Jurídica · legionjuridica.com</p></div>
    </div>`,
  },
  "caso-avanzo": {
    asunto: "📋 Tu caso avanzó: {{titulo_caso}}",
    html: `<div style="max-width:560px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif">
      <div style="background:#1a1a1a;border-radius:12px 12px 0 0;padding:28px;text-align:center;border-bottom:3px solid #C8A96E">
        <img src="https://legionjuridica.com/images/logo.svg" width="40" height="40" style="display:block;margin:0 auto 10px" />
        <h1 style="margin:0;font-size:16px;color:#C8A96E;letter-spacing:2px">ACTUALIZACIÓN DE CASO</h1>
      </div>
      <div style="background:#fff;padding:28px 32px">
        <h2 style="margin:0 0 8px;font-size:18px;color:#1a1a1a">Hola, {{nombre}}</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6">Tu caso ha avanzado a una nueva etapa:</p>
        <div style="background:#f8f7f4;border:1px solid #e5e2da;border-radius:10px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 4px;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px">Caso</p>
          <p style="margin:0 0 14px;font-size:15px;color:#1a1a1a;font-weight:bold">{{titulo_caso}}</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><p style="margin:0;font-size:10px;color:#999;text-transform:uppercase">Antes</p><p style="margin:2px 0 0;font-size:14px;color:#999;text-decoration:line-through">{{etapa_anterior}}</p></td>
            <td style="text-align:center;color:#C8A96E;font-size:18px">→</td>
            <td style="text-align:right"><p style="margin:0;font-size:10px;color:#999;text-transform:uppercase">Ahora</p><p style="margin:2px 0 0;font-size:14px;color:#16a34a;font-weight:bold">{{etapa}}</p></td>
          </tr></table>
          <div style="border-top:1px solid #e5e2da;margin-top:12px;padding-top:10px"><p style="margin:0;font-size:12px;color:#888">Abogado: <strong style="color:#1a1a1a">{{abogado}}</strong></p></div>
        </div>
        <p style="margin:0 0 20px;font-size:13px;color:#777;line-height:1.5">Si tienes preguntas sobre esta etapa, escríbenos por <a href="https://wa.me/573176689580" style="color:#25D366;font-weight:600;text-decoration:none">WhatsApp</a>.</p>
        <div style="text-align:center"><a href="https://legionjuridica.com/mi-caso" style="display:inline-block;padding:12px 32px;background:#1a1a1a;color:#C8A96E;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px">Ver mi caso</a></div>
      </div>
      <div style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;border-top:1px solid #eee"><p style="margin:0;font-size:10px;color:#ccc">Legión Jurídica · legionjuridica.com</p></div>
    </div>`,
  },
  "caso-cerrado": {
    asunto: "✅ Tu caso ha sido resuelto: {{titulo_caso}}",
    html: `<div style="max-width:560px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif">
      <div style="background:#1a1a1a;border-radius:12px 12px 0 0;padding:28px;text-align:center;border-bottom:3px solid #C8A96E">
        <img src="https://legionjuridica.com/images/logo.svg" width="40" height="40" style="display:block;margin:0 auto 10px" />
        <h1 style="margin:0;font-size:16px;color:#C8A96E;letter-spacing:2px">CASO CERRADO</h1>
      </div>
      <div style="background:#fff;padding:28px 32px">
        <h2 style="margin:0 0 8px;font-size:18px;color:#1a1a1a">Hola, {{nombre}}</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6">Nos complace informarte que tu caso ha sido cerrado exitosamente.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 4px;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px">Caso</p>
          <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a;font-weight:bold">{{titulo_caso}}</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><p style="margin:0;font-size:10px;color:#999;text-transform:uppercase">Área</p><p style="margin:2px 0 0;font-size:13px;color:#1a1a1a;font-weight:600">{{area}}</p></td>
            <td style="text-align:right"><p style="margin:0;font-size:10px;color:#999;text-transform:uppercase">Abogado</p><p style="margin:2px 0 0;font-size:13px;color:#1a1a1a;font-weight:600">{{abogado}}</p></td>
          </tr></table>
          <div style="border-top:1px solid #bbf7d0;margin-top:12px;padding-top:10px"><p style="margin:0;font-size:14px;color:#16a34a;font-weight:bold">✅ Cerrado — {{fecha}}</p></div>
        </div>
        <div style="background:#f8f7f4;border-left:3px solid #C8A96E;padding:12px 16px;margin-bottom:20px;border-radius:0 8px 8px 0">
          <p style="margin:0;font-size:13px;color:#555;line-height:1.5">Gracias por confiar en Legión Jurídica. Si necesitas asistencia legal en el futuro, estamos a tu disposición.</p>
        </div>
        <div style="text-align:center"><a href="https://legionjuridica.com/mi-caso" style="display:inline-block;padding:12px 32px;background:#1a1a1a;color:#C8A96E;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px">Ver resumen</a></div>
      </div>
      <div style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;border-top:1px solid #eee"><p style="margin:0;font-size:10px;color:#ccc">Legión Jurídica · legionjuridica.com</p></div>
    </div>`,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { slug, to, suscriptor_id, variables } = await request.json();

    // Resolve email: either provided directly or looked up by suscriptor_id
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

    // Merge nombre into variables
    if (nombre && variables) variables.nombre = variables.nombre || nombre;

    const template = TEMPLATES[slug];
    if (!template) {
      return NextResponse.json({ error: `Template "${slug}" no encontrado` }, { status: 404 });
    }

    const subject = renderTemplate(template.asunto, variables || {});
    const html = renderTemplate(template.html, variables || {});

    await sendMail({ to: email, subject, html });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[CASO MAIL]", err);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
