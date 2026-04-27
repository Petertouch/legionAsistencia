import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";

export async function POST(request: NextRequest) {
  try {
    const { nombre, email, code, tipo, clave_temporal } = await request.json();

    if (!email || !nombre || !code) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const tipoLabel = tipo === "esposa" ? "Aliada" : tipo === "vendedor" ? "Vendedor" : "Lanza";
    const panelLink = `https://legionjuridica.com/aliados`;
    const referralLink = `https://legionjuridica.com/r/${code}`;

    await sendMail({
      to: email,
      subject: `¡Bienvenido(a) al equipo, ${nombre.split(" ")[0]}! — Legión Jurídica`,
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;background:#ffffff;">
          <!-- Header -->
          <div style="background:#1a1a1a;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
            <img src="https://legionjuridica.com/images/logo.svg" alt="Legión Jurídica" width="48" height="48" style="display:block;margin:0 auto 12px;" />
            <h1 style="margin:0;font-size:18px;font-weight:900;color:#C8A96E;letter-spacing:2px">LEGIÓN JURÍDICA</h1>
            <p style="margin:6px 0 0;font-size:11px;color:rgba(200,169,110,0.5);letter-spacing:1px">Equipo de Aliados</p>
          </div>

          <!-- Body -->
          <div style="padding:36px 32px;">
            <h2 style="margin:0 0 4px;font-size:24px;color:#1a1a1a;font-weight:bold">¡Bienvenido(a), ${nombre.split(" ")[0]}! 🤝</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7">
              Ya haces parte del equipo de aliados de Legión Jurídica como <strong style="color:#1a1a1a">${tipoLabel}</strong>.
              Desde ahora puedes ganar dinero recomendando nuestro servicio legal a militares y policías.
            </p>

            <!-- How it works -->
            <div style="background:#f8f7f4;border:1px solid #e5e2da;border-radius:12px;padding:24px;margin-bottom:24px;">
              <h3 style="margin:0 0 14px;font-size:15px;color:#1a1a1a;font-weight:bold">¿Cómo funciona?</h3>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px">
                <tr>
                  <td style="width:36px;vertical-align:top;padding:8px 0"><div style="width:32px;height:32px;border-radius:50%;background:#C8A96E;color:#fff;text-align:center;line-height:32px;font-size:15px;font-weight:bold">1</div></td>
                  <td style="padding:8px 0 8px 12px"><p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600">Comparte tu link</p><p style="margin:4px 0 0;font-size:13px;color:#777">Envíalo por WhatsApp a tus contactos militares y policías.</p></td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px">
                <tr>
                  <td style="width:36px;vertical-align:top;padding:8px 0"><div style="width:32px;height:32px;border-radius:50%;background:#C8A96E;color:#fff;text-align:center;line-height:32px;font-size:15px;font-weight:bold">2</div></td>
                  <td style="padding:8px 0 8px 12px"><p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600">Ellos se registran</p><p style="margin:4px 0 0;font-size:13px;color:#777">Llenan sus datos y firman su contrato desde tu link.</p></td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="width:36px;vertical-align:top;padding:8px 0"><div style="width:32px;height:32px;border-radius:50%;background:#C8A96E;color:#fff;text-align:center;line-height:32px;font-size:15px;font-weight:bold">3</div></td>
                  <td style="padding:8px 0 8px 12px"><p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600">Tú ganas</p><p style="margin:4px 0 0;font-size:13px;color:#777">Por cada persona que aprobemos, recibes tu comisión.</p></td>
                </tr>
              </table>
            </div>

            <!-- Referral link -->
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:13px;color:#92400e;font-weight:bold">🔗 Tu link de referido</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:bold;word-break:break-all">${referralLink}</p>
              <p style="margin:6px 0 0;font-size:11px;color:#92400e">Código: <strong>${code}</strong></p>
            </div>

            <!-- Access credentials -->
            <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 10px;font-size:14px;color:#1e40af;font-weight:bold">🔐 Tu acceso al panel de aliados</p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:6px 0">
                    <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Tu usuario (cédula)</p>
                    <p style="margin:2px 0 0;font-size:16px;color:#1a1a1a;font-weight:bold">Ingresa con tu cédula</p>
                  </td>
                </tr>
                ${clave_temporal ? `<tr>
                  <td style="padding:6px 0">
                    <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Tu clave temporal</p>
                    <p style="margin:2px 0 0;font-size:16px;color:#1a1a1a;font-weight:bold;font-family:monospace;letter-spacing:1px">${clave_temporal}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0 0">
                    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5">⚠️ La primera vez que ingreses te pediremos cambiar esta clave.</p>
                  </td>
                </tr>` : ""}
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:24px;">
              <table cellpadding="0" cellspacing="0" width="100%" style="max-width:400px;margin:0 auto;">
                <tr>
                  <td style="padding:0 4px 0 0;width:60%">
                    <a href="${panelLink}" style="display:block;padding:14px 0;background:#1a1a1a;color:#C8A96E;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;text-align:center">
                      Ir a mi panel →
                    </a>
                  </td>
                  <td style="padding:0 0 0 4px;width:40%">
                    <a href="https://wa.me/573176689580" style="display:block;padding:14px 0;background:#25D366;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;text-align:center">
                      WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Personal note -->
            <p style="margin:0;font-size:13px;color:#888;line-height:1.6;font-style:italic">
              "Juntos protegemos a quienes protegen a Colombia."
            </p>
            <p style="margin:8px 0 0;font-size:13px;color:#555">
              El equipo de <strong style="color:#1a1a1a">Legión Jurídica</strong> ⚔️
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;border-top:1px solid #eee">
            <p style="margin:0 0 4px;font-size:11px;color:#999">📞 317 668 9580 · ✉️ info@legionjuridica.com</p>
            <p style="margin:0;font-size:10px;color:#ccc">Legión Jurídica · legionjuridica.com</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ALIADO MAIL]", err);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
