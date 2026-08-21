import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET ?id=CONTRATO_ID  → URL firmada (5 min) del PDF escaneado original, para previsualizar.
// GET ?path=fichas/... → URL firmada de un PDF recién subido (aún sin contrato en BD).
export async function GET(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabase = createAdminClient();
  const id = request.nextUrl.searchParams.get("id");
  const rawPath = request.nextUrl.searchParams.get("path");

  let bucket = "contratos";
  let path = "";

  if (id) {
    const { data: contrato, error } = await supabase
      .from("contratos").select("datos_completos").eq("id", id).single();
    if (error || !contrato) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    const dc = (contrato.datos_completos || {}) as Record<string, string>;
    path = dc.pdf_original_path || "";
    bucket = dc.pdf_bucket || "contratos";
    if (!path) return NextResponse.json({ error: "Este contrato no tiene PDF original adjunto" }, { status: 404 });
  } else if (rawPath) {
    // Solo permitir rutas dentro de la carpeta fichas/ del bucket de contratos
    if (!/^fichas\/[a-zA-Z0-9._-]+$/.test(rawPath)) {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
    }
    path = rawPath;
  } else {
    return NextResponse.json({ error: "Falta id o path" }, { status: 400 });
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
  if (error || !data) return NextResponse.json({ error: "No se pudo generar el enlace" }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
