import { NextRequest, NextResponse } from "next/server";
import { sendTemplate } from "@/lib/mail-templates";

export async function POST(request: NextRequest) {
  try {
    const { nombre, email, code, tipo, clave_temporal } = await request.json();

    if (!email || !nombre || !code) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const tipoLabel = tipo === "esposa" ? "Aliada" : tipo === "vendedor" ? "Vendedor" : "Lanza";

    // El cuerpo sale de la BD (mail_templates → slug "bienvenida-aliado").
    await sendTemplate({
      slug: "bienvenida-aliado",
      to: email,
      force: true, // transaccional (entrega el código de referido y la clave)
      variables: {
        nombre: nombre || "",
        tipo: tipoLabel,
        code: code || "",
        clave_temporal: clave_temporal || "",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ALIADO MAIL]", err);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
