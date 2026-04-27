import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { cedula } = await request.json();

    if (!cedula?.trim()) {
      return NextResponse.json({ error: "Cédula requerida" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: aliado } = await supabase
      .from("lanzas")
      .select("id, nombre, email, code")
      .eq("cedula", cedula.trim())
      .eq("status", "activo")
      .single();

    if (!aliado) {
      // Don't reveal if cedula exists or not
      return NextResponse.json({ ok: true });
    }

    if (!aliado.email) {
      return NextResponse.json({ error: "No tienes email registrado. Contacta al admin." }, { status: 400 });
    }

    // Generate new temp password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const tempClave = "LJ-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const hashed = await bcrypt.hash(tempClave, 12);

    // Update password
    await supabase
      .from("lanzas")
      .update({ clave: hashed, debe_cambiar_clave: true })
      .eq("id", aliado.id);

    // Send email
    const nombre = aliado.nombre.split(" ")[0];
    await sendMail({
      to: aliado.email,
      subject: `Tu nueva clave temporal — Legión Jurídica`,
      html: `
        <div style="max-width:520px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;">
          <div style="background:#1a1a1a;border-radius:12px 12px 0 0;padding:28px;text-align:center;">
            <img src="https://legionjuridica.com/images/logo.svg" alt="Legión Jurídica" width="40" height="40" style="display:block;margin:0 auto 10px;" />
            <h1 style="margin:0;font-size:16px;color:#C8A96E;letter-spacing:2px">LEGIÓN JURÍDICA</h1>
          </div>
          <div style="background:#fff;padding:32px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;">Hola, ${nombre}</h2>
            <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
              Recibimos tu solicitud de recuperación de clave. Aquí está tu nueva clave temporal:
            </p>
            <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
              <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px">Tu nueva clave temporal</p>
              <p style="margin:0;font-size:24px;color:#1a1a1a;font-weight:900;font-family:monospace;letter-spacing:2px">${tempClave}</p>
            </div>
            <p style="margin:0 0 20px;font-size:13px;color:#777;line-height:1.6;">
              Ingresa a <a href="https://legionjuridica.com/aliados" style="color:#C8A96E;font-weight:600;text-decoration:none">legionjuridica.com/aliados</a>
              con tu cédula y esta clave. Te pediremos que la cambies por una personal.
            </p>
            <div style="text-align:center;">
              <a href="https://legionjuridica.com/aliados" style="display:inline-block;padding:14px 36px;background:#1a1a1a;color:#C8A96E;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px">
                Ir al portal →
              </a>
            </div>
          </div>
          <div style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;border-top:1px solid #eee">
            <p style="margin:0;font-size:10px;color:#ccc">Si no solicitaste esto, ignora este mensaje. Legión Jurídica · legionjuridica.com</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ALIADO RECUPERAR]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
