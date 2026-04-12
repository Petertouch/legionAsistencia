import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const BUCKET = "avatars";
const ALLOWED_FOLDERS = ["profesores", "cursos", "recursos", "documentos", "videos", "avatars"];

export async function POST(request: NextRequest) {
  // Auth check
  const userRole = request.headers.get("x-user-role");
  if (!userRole || !["admin", "abogado", "profesor"].includes(userRole)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Formato no permitido. Usa JPG, PNG, WebP, PDF, Word o Excel" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Archivo muy grande. Máximo 10MB" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Asegurar que el bucket existe
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find((b) => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, { public: true });
    }

    // Sanitize folder — only allow whitelisted folder names, no path traversal
    const rawFolder = (formData.get("folder") as string) || "profesores";
    const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : "profesores";

    // Sanitize filename — strip path separators and dangerous chars
    const rawExt = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "");
    const ext = rawExt.slice(0, 10); // limit extension length
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    // Subir archivo
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error subiendo archivo" },
      { status: 500 }
    );
  }
}
