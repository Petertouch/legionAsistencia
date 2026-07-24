import { NextRequest, NextResponse } from "next/server";
import { getAllTemplates, updateTemplate } from "@/lib/mail-templates";

// GET: lista todas las plantillas efectivas (semilla + overrides de BD). Solo admin.
export async function GET(request: NextRequest) {
  if (request.headers.get("x-user-role") !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const templates = await getAllTemplates();
  return NextResponse.json(templates);
}

// PATCH: guarda el asunto/cuerpo/activo de una plantilla. Solo admin.
export async function PATCH(request: NextRequest) {
  if (request.headers.get("x-user-role") !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { slug, asunto, cuerpo, activo } = await request.json();
    if (!slug) {
      return NextResponse.json({ error: "slug requerido" }, { status: 400 });
    }
    const updated = await updateTemplate(slug, { asunto, cuerpo, activo });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al guardar" },
      { status: 500 }
    );
  }
}
