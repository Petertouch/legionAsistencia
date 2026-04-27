import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import { generateContratoPDF } from "@/lib/generate-contrato-pdf";

export async function POST(request: NextRequest) {
  try {
    const { contrato_id, nombre, email, plan, cedula, clave_temporal } = await request.json();

    if (!contrato_id || !email || !nombre) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const fecha = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
    const supabase = createAdminClient();

    // Get the real contract from DB
    let pdfBuffer: Buffer | null = null;
    try {
      const { data: contrato } = await supabase
        .from("contratos")
        .select("*")
        .eq("id", contrato_id)
        .single();

      const { data: plantilla } = await supabase
        .from("contrato_plantilla")
        .select("*")
        .eq("activo", true)
        .single();

      if (contrato) {
        pdfBuffer = await generateContratoPDF(contrato, plantilla);
      }
    } catch (err) {
      console.error("[BIENVENIDA] Error generating PDF:", err);
    }

    const claveTemporal = clave_temporal || "";

    await sendMail({
      to: email,
      subject: `¡Bienvenido a Legión Jurídica, ${nombre}!`,
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;background:#ffffff;">
          <!-- Header with logo -->
          <div style="background:#1a1a1a;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
            <img src="https://legionjuridica.com/images/logo.svg" alt="Legión Jurídica" width="48" height="48" style="display:block;margin:0 auto 12px;" />
            <h1 style="margin:0;font-size:18px;font-weight:900;color:#C8A96E;letter-spacing:2px">LEGIÓN JURÍDICA</h1>
            <p style="margin:6px 0 0;font-size:11px;color:rgba(200,169,110,0.5);letter-spacing:1px">Tu escudo legal</p>
          </div>

          <!-- Welcome -->
          <div style="padding:36px 32px 0;">
            <h2 style="margin:0 0 4px;font-size:24px;color:#1a1a1a;font-weight:bold">¡Bienvenido, ${nombre}! 🎉</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7">
              Nos alegra mucho que hagas parte de nuestra familia. A partir de hoy cuentas con un equipo de abogados
              especializados en derecho militar y policial, listos para protegerte a ti y a tu familia.
            </p>
          </div>

          <!-- Plan card -->
          <div style="margin:0 32px 24px;background:linear-gradient(135deg,#f8f7f4 0%,#f0efe8 100%);border:1px solid #e5e2da;border-radius:12px;padding:22px;position:relative;overflow:hidden;">
            <div style="position:absolute;top:0;right:0;background:#C8A96E;color:#fff;font-size:10px;font-weight:bold;padding:4px 14px;border-radius:0 0 0 8px;letter-spacing:0.5px">ACTIVO</div>
            <p style="margin:0;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px">Tu plan</p>
            <p style="margin:4px 0 0;font-size:22px;color:#1a1a1a;font-weight:bold">${plan || "Base"}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#888">Activo desde ${fecha}</p>
          </div>

          <!-- How it works -->
          <div style="padding:0 32px;">
            <h3 style="margin:0 0 6px;font-size:16px;color:#1a1a1a;font-weight:bold">¿Cómo funciona? Es muy sencillo:</h3>
            <p style="margin:0 0 20px;font-size:13px;color:#888;line-height:1.5">Estos son los pasos para que aproveches al máximo tu servicio:</p>

            <!-- Step 1 -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px">
              <tr>
                <td style="width:44px;vertical-align:top">
                  <div style="width:36px;height:36px;border-radius:50%;background:#C8A96E;color:#fff;text-align:center;line-height:36px;font-size:16px;font-weight:bold">1</div>
                </td>
                <td style="padding:2px 0 0 12px">
                  <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600">Ingresa a tu portal</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#777;line-height:1.5">Entra a <a href="https://legionjuridica.com/mi-caso" style="color:#C8A96E;font-weight:600;text-decoration:none">legionjuridica.com/mi-caso</a> con tu cédula y tu clave. Ahí puedes ver tus casos, hablar con tu abogado y mucho más.</p>
                </td>
              </tr>
            </table>

            <!-- Step 2 -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px">
              <tr>
                <td style="width:44px;vertical-align:top">
                  <div style="width:36px;height:36px;border-radius:50%;background:#C8A96E;color:#fff;text-align:center;line-height:36px;font-size:16px;font-weight:bold">2</div>
                </td>
                <td style="padding:2px 0 0 12px">
                  <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600">¿Tienes una duda legal? Escríbenos</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#777;line-height:1.5">Puedes consultarnos por <a href="https://wa.me/573176689580" style="color:#25D366;font-weight:600;text-decoration:none">WhatsApp al 317 668 9580</a> o desde tu portal. No importa el tema — disciplinarios, familia, pensiones, documentos — estamos para ayudarte.</p>
                </td>
              </tr>
            </table>

            <!-- Step 3 -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
              <tr>
                <td style="width:44px;vertical-align:top">
                  <div style="width:36px;height:36px;border-radius:50%;background:#C8A96E;color:#fff;text-align:center;line-height:36px;font-size:16px;font-weight:bold">3</div>
                </td>
                <td style="padding:2px 0 0 12px">
                  <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600">Te asignamos un abogado</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#777;line-height:1.5">Según tu caso, un abogado especializado se encargará de tu situación. Podrás ver el avance paso a paso desde tu portal.</p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Access credentials -->
          <div style="margin:0 32px 24px;background:#f0f7ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;">
            <p style="margin:0 0 10px;font-size:14px;color:#1e40af;font-weight:bold">🔐 Tus datos de acceso</p>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:6px 0">
                  <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Tu usuario (cédula)</p>
                  <p style="margin:2px 0 0;font-size:16px;color:#1a1a1a;font-weight:bold">${cedula}</p>
                </td>
              </tr>
              ${claveTemporal ? `<tr>
                <td style="padding:6px 0">
                  <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Tu clave temporal</p>
                  <p style="margin:2px 0 0;font-size:16px;color:#1a1a1a;font-weight:bold;font-family:monospace;letter-spacing:1px">${claveTemporal}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0 0">
                  <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5">⚠️ La primera vez que ingreses te pediremos que cambies esta clave por una personal.</p>
                </td>
              </tr>` : ""}
            </table>
          </div>

          <!-- CTA -->
          <div style="text-align:center;padding:0 32px 32px;">
            <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 auto;max-width:400px;">
              <tr>
                <td style="padding:0 4px 0 0;width:65%">
                  <a href="https://legionjuridica.com/mi-caso" style="display:block;padding:14px 0;background:#1a1a1a;color:#C8A96E;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;text-align:center">
                    Ingresar a mi portal →
                  </a>
                </td>
                <td style="padding:0 0 0 4px;width:35%">
                  <a href="https://wa.me/573176689580" style="display:block;padding:14px 0;background:#25D366;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;text-align:center">
                    WhatsApp
                  </a>
                </td>
              </tr>
            </table>
          </div>

          <!-- Contract note -->
          <div style="margin:0 32px 24px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;">
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6">
              📎 <strong>Tu contrato firmado</strong> está adjunto a este correo en formato PDF. Guárdalo para tus registros personales.
            </p>
          </div>

          <!-- Personal note -->
          <div style="padding:0 32px 28px;">
            <p style="margin:0;font-size:13px;color:#888;line-height:1.6;font-style:italic">
              "Tu misión es servir a la patria. La nuestra es protegerte."
            </p>
            <p style="margin:8px 0 0;font-size:13px;color:#555">
              Un abrazo del equipo de <strong style="color:#1a1a1a">Legión Jurídica</strong> ⚔️
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;border-top:1px solid #eee">
            <p style="margin:0 0 4px;font-size:11px;color:#999">📞 317 668 9580 · ✉️ info@legionjuridica.com</p>
            <p style="margin:0;font-size:10px;color:#ccc">Legión Jurídica · Cra 7 #81-49 Of. 301, Bogotá · legionjuridica.com</p>
          </div>
        </div>
      `,
      attachments: pdfBuffer ? [{
        filename: `Contrato_Legion_${cedula || "cliente"}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }] : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[BIENVENIDA MAIL]", err);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
