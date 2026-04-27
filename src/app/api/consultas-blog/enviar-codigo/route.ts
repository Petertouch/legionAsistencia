import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";

// Rate limit: 3 per 15 min per IP
const attempts = new Map<string, number[]>();
const MAX = 3;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, list);
  if (list.length >= MAX) return true;
  list.push(now);
  return false;
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
  }

  try {
    const { nombre, apellido, telefono, email, area, pregunta } = await request.json();

    if (!nombre?.trim() || !apellido?.trim() || !telefono?.trim() || !email?.trim() || !pregunta?.trim()) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    if (pregunta.trim().length < 15) {
      return NextResponse.json({ error: "La pregunta debe tener al menos 15 caracteres" }, { status: 400 });
    }

    const code = generateCode();
    const supabase = createAdminClient();

    // Delete any previous unverified entry for this email
    await supabase
      .from("consultas_blog")
      .delete()
      .eq("email", email.trim().toLowerCase())
      .eq("status", "verificando");

    // Insert with status "verificando"
    const { error: insertErr } = await supabase
      .from("consultas_blog")
      .insert({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        email: email.trim().toLowerCase(),
        area: area?.trim() || "General",
        pregunta: pregunta.trim(),
        status: "verificando",
        codigo: code,
      });

    if (insertErr) {
      console.error("[CONSULTA INSERT]", insertErr);
      return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
    }

    // Send email
    await sendMail({
      to: email.trim(),
      subject: "Confirma tu consulta legal gratuita — Legión Jurídica",
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 28px;">
            <h1 style="color: #1a1a1a; font-size: 22px; margin: 0;">Legión Jurídica</h1>
            <p style="color: #888; font-size: 13px; margin: 4px 0 0;">Guía Legal Militar</p>
          </div>

          <p style="color: #333; font-size: 15px; margin: 0 0 8px;">Hola <strong>${nombre.trim()}</strong>,</p>

          <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
            Recibimos tu consulta de <strong>orientación legal gratuita</strong>. Para asegurarnos de que eres tú y proteger tu información,
            necesitamos que confirmes tu correo electrónico ingresando este código en la página:
          </p>

          <div style="background: #f8f7f4; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 20px;">
            <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Tu código de verificación</p>
            <div style="background: #1a1a1a; color: #d4a843; font-size: 36px; font-weight: 900; letter-spacing: 10px; padding: 18px 28px; border-radius: 10px; display: inline-block;">
              ${code}
            </div>
          </div>

          <div style="background: #f0f7ff; border-left: 3px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 14px 16px; margin-bottom: 20px;">
            <p style="color: #1e40af; font-size: 13px; font-weight: 600; margin: 0 0 6px;">¿Qué debes hacer?</p>
            <ol style="color: #555; font-size: 13px; line-height: 1.7; margin: 0; padding-left: 18px;">
              <li>Vuelve a la página de <strong>Legión Jurídica</strong> donde estabas</li>
              <li>Ingresa el código de 6 dígitos en las casillas</li>
              <li>Dale clic en <strong>"Verificar y enviar consulta"</strong></li>
            </ol>
          </div>

          <p style="color: #555; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
            <strong>¿Qué pasa después?</strong> Un abogado de nuestro equipo revisará tu consulta y te enviaremos
            la respuesta a este mismo correo en un promedio de <strong>8 horas</strong>. Es completamente gratis
            y confidencial.
          </p>

          <p style="color: #999; font-size: 12px; margin: 20px 0 0; text-align: center;">
            Este código expira en <strong>10 minutos</strong>. Si no lo usas a tiempo, puedes solicitar uno nuevo.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

          <p style="color: #bbb; font-size: 11px; text-align: center;">
            Si no solicitaste este código, puedes ignorar este mensaje con tranquilidad.<br/>
            © Legión Jurídica · legionjuridica.com
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[CONSULTA CODE]", err);
    return NextResponse.json({ error: "Error al enviar el código" }, { status: 500 });
  }
}
