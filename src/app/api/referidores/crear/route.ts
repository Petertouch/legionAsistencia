import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import bcrypt from "bcryptjs";

function generateCode(tipo: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const prefixMap: Record<string, string> = { vendedor: "V-", lanza: "L-", esposa: "E-" };
  const prefix = prefixMap[tipo] || `${tipo[0].toUpperCase()}-`;
  return `${prefix}${code}`;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return "LJ-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, nombre, cedula, telefono, email, ciudad, rama, rango, suscriptor_id, comision_personalizada, meta_bono, monto_bono, bono_pagado_at, color, notas } = body;

    if (!nombre || !tipo) {
      return NextResponse.json({ error: "Nombre y tipo son requeridos" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const code = generateCode(tipo);
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const { data, error } = await supabase
      .from("lanzas")
      .insert({
        code,
        tipo,
        nombre: nombre.trim(),
        cedula: cedula?.trim() || "",
        telefono: telefono?.trim() || "",
        email: email?.trim() || "",
        ciudad: ciudad?.trim() || "",
        rama: rama?.trim() || "",
        rango: rango?.trim() || "",
        suscriptor_id: suscriptor_id || null,
        comision_personalizada: comision_personalizada || null,
        meta_bono: meta_bono || null,
        monto_bono: monto_bono || null,
        bono_pagado_at: bono_pagado_at || null,
        color: color || null,
        notas: notas || null,
        status: "activo",
        clave: hashedPassword,
        debe_cambiar_clave: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send welcome email directly (not via HTTP to avoid serverless self-call issues)
    if (email?.trim()) {
      try {
      const tipoLabel = tipo === "esposa" ? "Aliada" : tipo === "vendedor" ? "Vendedor" : "Lanza";
      const referralLink = `https://legionjuridica.com/r/${code}`;
      const firstName = nombre.trim().split(" ")[0];
      await sendMail({
        to: email.trim(),
        subject: `¡Bienvenido(a) al equipo, ${firstName}! — Legión Jurídica`,
        html: `<div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;background:#fff">
          <div style="background:#1a1a1a;border-radius:12px 12px 0 0;padding:32px;text-align:center">
            <img src="https://legionjuridica.com/images/logo.svg" width="48" height="48" style="display:block;margin:0 auto 12px" />
            <h1 style="margin:0;font-size:18px;color:#C8A96E;letter-spacing:2px">LEGIÓN JURÍDICA</h1>
            <p style="margin:6px 0 0;font-size:11px;color:rgba(200,169,110,0.5)">Equipo de Aliados</p>
          </div>
          <div style="padding:36px 32px">
            <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a1a">¡Bienvenido(a), ${firstName}! 🤝</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7">Ya haces parte del equipo como <strong>${tipoLabel}</strong>. Desde ahora puedes ganar dinero recomendando nuestro servicio legal.</p>
            <div style="background:#f8f7f4;border:1px solid #e5e2da;border-radius:12px;padding:24px;margin-bottom:24px">
              <h3 style="margin:0 0 14px;font-size:15px;color:#1a1a1a;font-weight:bold">¿Cómo funciona?</h3>
              <p style="margin:0 0 8px;font-size:13px;color:#555"><strong style="color:#C8A96E">1.</strong> Comparte tu link por WhatsApp</p>
              <p style="margin:0 0 8px;font-size:13px;color:#555"><strong style="color:#C8A96E">2.</strong> Ellos se registran y firman contrato</p>
              <p style="margin:0;font-size:13px;color:#555"><strong style="color:#C8A96E">3.</strong> Tú ganas comisión por cada aprobado</p>
            </div>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:24px">
              <p style="margin:0 0 6px;font-size:13px;color:#92400e;font-weight:bold">🔗 Tu link de referido</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:bold;word-break:break-all">${referralLink}</p>
              <p style="margin:6px 0 0;font-size:11px;color:#92400e">Código: <strong>${code}</strong></p>
            </div>
            <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:24px">
              <p style="margin:0 0 10px;font-size:14px;color:#1e40af;font-weight:bold">🔐 Tu acceso al panel</p>
              <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase">Tu usuario (cédula)</p>
              <p style="margin:0 0 10px;font-size:16px;color:#1a1a1a;font-weight:bold">Ingresa con tu cédula</p>
              <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase">Tu clave temporal</p>
              <p style="margin:0 0 10px;font-size:16px;color:#1a1a1a;font-weight:bold;font-family:monospace;letter-spacing:1px">${tempPassword}</p>
              <p style="margin:0;font-size:12px;color:#64748b">⚠️ La primera vez te pediremos cambiarla.</p>
            </div>
            <div style="text-align:center">
              <a href="https://legionjuridica.com/aliados" style="display:inline-block;padding:14px 36px;background:#1a1a1a;color:#C8A96E;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px">Ir a mi panel →</a>
            </div>
          </div>
          <div style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;border-top:1px solid #eee"><p style="margin:0;font-size:10px;color:#ccc">Legión Jurídica · legionjuridica.com</p></div>
        </div>`,
      });
      } catch (mailErr) {
        console.error("[ALIADO MAIL]", mailErr);
      }
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
