import { NextRequest, NextResponse } from "next/server";
import { sendTemplate } from "@/lib/mail-templates";

// Envío genérico por slug: el asunto/cuerpo/activo salen de la BD (mail_templates).
export async function POST(request: NextRequest) {
  if (request.headers.get("x-user-role") !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { to, slug, variables } = await request.json();
    if (!to || !slug) {
      return NextResponse.json({ error: "Faltan campos: to, slug" }, { status: 400 });
    }

    const sent = await sendTemplate({ slug, to, variables: variables || {} });
    return NextResponse.json({ success: sent, slug });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error enviando email" },
      { status: 500 }
    );
  }
}
