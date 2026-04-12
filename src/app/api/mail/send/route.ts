import { NextRequest, NextResponse } from "next/server";
import { sendMail, renderTemplate } from "@/lib/mail";

export async function POST(request: NextRequest) {
  // Auth check (inyectado por middleware)
  const userRole = request.headers.get("x-user-role");
  if (userRole !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { to, slug, subject, html, variables } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Faltan campos: to, subject, html" }, { status: 400 });
    }

    // Renderizar variables en asunto y cuerpo
    const renderedSubject = renderTemplate(subject, variables || {});
    const renderedHtml = renderTemplate(html, variables || {});

    const data = await sendMail({
      to,
      subject: renderedSubject,
      html: renderedHtml,
    });

    return NextResponse.json({ success: true, id: data?.id, slug });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error enviando email" },
      { status: 500 }
    );
  }
}
