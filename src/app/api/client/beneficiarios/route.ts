import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";

// GET: listar beneficiarios del suscriptor
export async function GET(request: NextRequest) {
  const suscriptorId = request.nextUrl.searchParams.get("suscriptor_id");
  if (!suscriptorId) {
    return NextResponse.json({ error: "suscriptor_id requerido" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("beneficiarios")
    .select("*")
    .eq("suscriptor_id", suscriptorId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

const PARENTESCOS = ["Cónyuge", "Hijo(a)", "Padre", "Madre", "Hermano(a)"];

// POST: pre-registrar un familiar (queda inactivo hasta que se apruebe la cuenta)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suscriptor_id, nombre, parentesco, cedula, email, telefono } = body;

    if (!suscriptor_id || !nombre || !parentesco || !cedula) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (!PARENTESCOS.includes(parentesco)) {
      return NextResponse.json({ error: "Parentesco inválido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verificar que el suscriptor existe
    const { data: sus } = await supabase
      .from("suscriptores")
      .select("id, estado_pago")
      .eq("id", suscriptor_id)
      .single();

    if (!sus) {
      return NextResponse.json({ error: "Suscriptor no encontrado" }, { status: 404 });
    }

    // Check duplicado por cédula dentro del mismo suscriptor
    const { data: existing } = await supabase
      .from("beneficiarios")
      .select("id")
      .eq("suscriptor_id", suscriptor_id)
      .eq("cedula", cedula.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ya tienes un familiar registrado con esta cédula" },
        { status: 409 }
      );
    }

    // Si la cuenta ya está aprobada ("Al dia"), el beneficiario se activa de una vez.
    // Si está "Pendiente", queda inactivo hasta que un admin apruebe la cuenta.
    const activo = sus.estado_pago === "Al dia";

    const { data, error } = await supabase
      .from("beneficiarios")
      .insert({
        suscriptor_id,
        nombre: nombre.trim(),
        parentesco,
        cedula: cedula.trim(),
        email: email?.trim() || null,
        telefono: telefono?.trim() || null,
        activo,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send welcome email to beneficiary if they have email
    if (data && email?.trim()) {
      // Get suscriptor name
      const { data: susData } = await supabase.from("suscriptores").select("nombre, plan").eq("id", suscriptor_id).single();
      const suscriptorNombre = susData?.nombre || "tu familiar";
      const planNombre = susData?.plan || "Legión Jurídica";

      const parentescoTexto: Record<string, string> = {
        "Cónyuge": "tu pareja",
        "Hijo(a)": "tu padre/madre",
        "Padre": "tu hijo(a)",
        "Madre": "tu hijo(a)",
        "Hermano(a)": "tu hermano(a)",
      };
      const quienTeAgrego = parentescoTexto[parentesco] || "tu familiar";

      sendMail({
        to: email.trim(),
        subject: `¡Estás protegido(a) por Legión Jurídica, ${nombre.trim().split(" ")[0]}!`,
        html: `
          <div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;background:#ffffff;">
            <!-- Header -->
            <div style="background:#1a1a1a;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
              <img src="https://legionjuridica.com/images/logo.svg" alt="Legión Jurídica" width="48" height="48" style="display:block;margin:0 auto 12px;" />
              <h1 style="margin:0;font-size:18px;font-weight:900;color:#C8A96E;letter-spacing:2px">LEGIÓN JURÍDICA</h1>
              <p style="margin:6px 0 0;font-size:11px;color:rgba(200,169,110,0.5);letter-spacing:1px">Tu escudo legal</p>
            </div>

            <!-- Body -->
            <div style="padding:36px 32px;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;font-weight:bold">¡Hola, ${nombre.trim().split(" ")[0]}! 🛡️</h2>

              <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7">
                Te escribimos porque <strong style="color:#1a1a1a">${suscriptorNombre}</strong> (${quienTeAgrego})
                te agregó como beneficiario(a) de su plan <strong style="color:#C8A96E">${planNombre}</strong> en Legión Jurídica.
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7">
                Esto significa que a partir de ahora <strong style="color:#1a1a1a">también cuentas con protección legal</strong>.
                Nuestro equipo de abogados está disponible para ayudarte si lo necesitas.
              </p>

              <!-- What this means -->
              <div style="background:#f8f7f4;border:1px solid #e5e2da;border-radius:12px;padding:24px;margin-bottom:24px;">
                <h3 style="margin:0 0 14px;font-size:15px;color:#1a1a1a;font-weight:bold">¿Qué significa esto para ti?</h3>

                <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px">
                  <tr>
                    <td style="width:36px;vertical-align:top;padding:8px 0"><div style="width:32px;height:32px;border-radius:50%;background:#C8A96E;color:#fff;text-align:center;line-height:32px;font-size:15px;font-weight:bold">✓</div></td>
                    <td style="padding:8px 0 8px 12px"><p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600">Estás protegido(a)</p><p style="margin:4px 0 0;font-size:13px;color:#777;line-height:1.5">Cuentas con cobertura legal como beneficiario(a) del plan.</p></td>
                  </tr>
                </table>
                <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px">
                  <tr>
                    <td style="width:36px;vertical-align:top;padding:8px 0"><div style="width:32px;height:32px;border-radius:50%;background:#C8A96E;color:#fff;text-align:center;line-height:32px;font-size:15px;font-weight:bold">✓</div></td>
                    <td style="padding:8px 0 8px 12px"><p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600">Puedes consultar</p><p style="margin:4px 0 0;font-size:13px;color:#777;line-height:1.5">Si tienes una duda legal, puedes escribirnos por WhatsApp y te atendemos.</p></td>
                  </tr>
                </table>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="width:36px;vertical-align:top;padding:8px 0"><div style="width:32px;height:32px;border-radius:50%;background:#C8A96E;color:#fff;text-align:center;line-height:32px;font-size:15px;font-weight:bold">✓</div></td>
                    <td style="padding:8px 0 8px 12px"><p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600">No tienes que hacer nada</p><p style="margin:4px 0 0;font-size:13px;color:#777;line-height:1.5">Tu cobertura ya está activa. Solo guarda este correo por si lo necesitas.</p></td>
                  </tr>
                </table>
              </div>

              <!-- Your info -->
              <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:13px;color:#1e40af;font-weight:bold">📋 Tus datos registrados</p>
                <p style="margin:0;font-size:13px;color:#555;">Nombre: <strong style="color:#1a1a1a">${nombre.trim()}</strong></p>
                <p style="margin:4px 0 0;font-size:13px;color:#555;">Parentesco: <strong style="color:#1a1a1a">${parentesco}</strong></p>
                <p style="margin:4px 0 0;font-size:13px;color:#555;">Registrado por: <strong style="color:#1a1a1a">${suscriptorNombre}</strong></p>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="https://wa.me/573176689580?text=${encodeURIComponent(`Hola, soy ${nombre.trim()}, beneficiario(a) de ${suscriptorNombre}. Tengo una consulta.`)}" style="display:inline-block;padding:14px 36px;background:#1a1a1a;color:#C8A96E;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;">
                  Escribirnos por WhatsApp
                </a>
                <p style="margin:10px 0 0;font-size:12px;color:#aaa;">o llámanos al 317 668 9580</p>
              </div>

              <!-- Personal note -->
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;font-style:italic">
                "Tu familia también merece protección legal. Estamos aquí para cuidarlos."
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#555">
                Un abrazo del equipo de <strong style="color:#1a1a1a">Legión Jurídica</strong> ⚔️
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;border-top:1px solid #eee">
              <p style="margin:0 0 4px;font-size:11px;color:#999">📞 317 668 9580 · ✉️ info@legionjuridica.com</p>
              <p style="margin:0;font-size:10px;color:#ccc">Legión Jurídica · legionjuridica.com</p>
            </div>
          </div>
        `,
      }).catch((err) => console.error("[BENEFICIARIO MAIL]", err));
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: eliminar un beneficiario
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const suscriptorId = request.nextUrl.searchParams.get("suscriptor_id");

  if (!id || !suscriptorId) {
    return NextResponse.json({ error: "id y suscriptor_id requeridos" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verificar propiedad
  const { data: ben } = await supabase
    .from("beneficiarios")
    .select("id, suscriptor_id")
    .eq("id", id)
    .eq("suscriptor_id", suscriptorId)
    .single();

  if (!ben) {
    return NextResponse.json({ error: "Familiar no encontrado" }, { status: 404 });
  }

  const { error } = await supabase.from("beneficiarios").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
