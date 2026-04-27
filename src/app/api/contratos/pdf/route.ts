import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateContratoPDF } from "@/lib/generate-contrato-pdf";

// GET /api/contratos/pdf?id=CONTRATO_ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const format = searchParams.get("format") || "download";

    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const supabase = createAdminClient();

    const { data: contrato, error } = await supabase
      .from("contratos")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !contrato) {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }

    const { data: plantilla } = await supabase
      .from("contrato_plantilla")
      .select("*")
      .eq("activo", true)
      .single();

    const pdfBuffer = await generateContratoPDF(contrato, plantilla);

    if (format === "base64") {
      const base64 = pdfBuffer.toString("base64");
      return NextResponse.json({ base64, filename: `Contrato_${contrato.cedula}.pdf` });
    }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Contrato_Legion_${contrato.cedula}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[CONTRATO PDF]", err);
    return NextResponse.json({ error: "Error al generar PDF" }, { status: 500 });
  }
}
