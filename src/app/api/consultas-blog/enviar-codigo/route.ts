import { NextRequest, NextResponse } from "next/server";
import { sendTemplate } from "@/lib/mail-templates";
import { createAdminClient } from "@/lib/supabase/admin";

// Rate limit: 3 per 15 min per IP
const attempts = new Map<string, number[]>();
const MAX = 3;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, list);
  if (list.length >= MAX) return true;
  list.push(now);
  return false;
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
  }

  try {
    const { nombre, apellido, telefono, email, area, pregunta } = await request.json();

    if (!nombre?.trim() || !apellido?.trim() || !telefono?.trim() || !email?.trim() || !pregunta?.trim()) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    if (pregunta.trim().length < 15) {
      return NextResponse.json({ error: "La pregunta debe tener al menos 15 caracteres" }, { status: 400 });
    }

    const code = generateCode();
    const supabase = createAdminClient();

    // Delete any previous unverified entry for this email
    await supabase
      .from("consultas_blog")
      .delete()
      .eq("email", email.trim().toLowerCase())
      .eq("status", "verificando");

    // Insert with status "verificando"
    const { error: insertErr } = await supabase
      .from("consultas_blog")
      .insert({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        email: email.trim().toLowerCase(),
        area: area?.trim() || "General",
        pregunta: pregunta.trim(),
        status: "verificando",
        codigo: code,
      });

    if (insertErr) {
      console.error("[CONSULTA INSERT]", insertErr);
      return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
    }

    // Cuerpo desde la BD (mail_templates → "consulta-blog-codigo").
    await sendTemplate({
      slug: "consulta-blog-codigo",
      to: email.trim(),
      force: true, // código de verificación: siempre debe salir
      variables: { nombre: nombre.trim(), codigo: code },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[CONSULTA CODE]", err);
    return NextResponse.json({ error: "Error al enviar el código" }, { status: 500 });
  }
}
