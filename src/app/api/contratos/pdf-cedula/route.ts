import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateContratoPDF } from "@/lib/generate-contrato-pdf";
import archiver from "archiver";

// GET /api/contratos/pdf-cedula?cedula=123
export async function GET(request: NextRequest) {
  try {
    const cedula = new URL(request.url).searchParams.get("cedula");
    if (!cedula) return NextResponse.json({ error: "cedula requerida" }, { status: 400 });

    const supabase = createAdminClient();

    const { data: contrato } = await supabase
      .from("contratos")
      .select("*")
      .eq("cedula", cedula.trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!contrato) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });

    const { data: plantilla } = await supabase
      .from("contrato_plantilla")
      .select("*")
      .eq("activo", true)
      .single();

    const pdfBuffer = await generateContratoPDF(contrato, plantilla);
    const nombre = (contrato.nombre || "cliente").replace(/\s+/g, "_");

    // Create zip
    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("data", (chunk: Buffer) => chunks.push(chunk));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", reject);
      archive.append(pdfBuffer, { name: `Contrato_${nombre}_${cedula}.pdf` });
      archive.finalize();
    });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Contrato_${nombre}_${cedula}.zip"`,
      },
    });
  } catch (err) {
    console.error("[PDF CEDULA]", err);
    return NextResponse.json({ error: "Error al generar PDF" }, { status: 500 });
  }
}
