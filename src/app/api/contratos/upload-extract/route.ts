import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractFichaFromPdf } from "@/lib/contrato-extract";

const BUCKET = "contratos";
const MAX_SIZE = 10 * 1024 * 1024;

// POST: sube un PDF de contrato firmado a un bucket privado y extrae la ficha con IA.
// No crea nada en BD todavía; devuelve la data para que el admin la revise y confirme.
export async function POST(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Solo se permiten PDFs" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Archivo muy grande (máx 10MB)" }, { status: 400 });

    const supabase = createAdminClient();

    // Bucket privado (PII sensible: cédulas, huellas, firmas)
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find((b) => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, { public: false });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeName = (file.name || "contrato.pdf").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
    const path = `fichas/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: "application/pdf", upsert: false });
    if (upErr) return NextResponse.json({ error: "Error subiendo: " + upErr.message }, { status: 500 });

    // Extracción por IA (si no hay API key, devuelve extractError y el admin llena a mano)
    const { data: extracted, error: extractError } = await extractFichaFromPdf(buffer.toString("base64"));

    return NextResponse.json({
      pdf_bucket: BUCKET,
      pdf_original_path: path,
      pdf_filename: file.name || "contrato.pdf",
      extracted,
      extractError: extractError || null,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error del servidor" }, { status: 500 });
  }
}
