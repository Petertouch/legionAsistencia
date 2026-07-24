import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplate } from "@/lib/mail-templates";
import { generateContratoPDF } from "@/lib/generate-contrato-pdf";

export async function POST(request: NextRequest) {
  try {
    const { contrato_id, nombre, email, plan, cedula, clave_temporal } = await request.json();

    if (!contrato_id || !email || !nombre) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const fecha = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
    const supabase = createAdminClient();

    // Generar el PDF del contrato real desde la BD
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

    // El cuerpo del correo sale de la BD (mail_templates → slug "bienvenida").
    await sendTemplate({
      slug: "bienvenida",
      to: email,
      force: true, // transaccional crítico (adjunta el contrato)
      variables: {
        nombre: nombre || "",
        plan: plan || "Base",
        email,
        cedula: cedula || "",
        fecha,
        clave_temporal: clave_temporal || "",
      },
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
