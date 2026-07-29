import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Feed PÚBLICO de consultas resueltas para el blog.
// Solo expone campos seguros (sin email/teléfono/apellido) → sin fuga de datos.
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("consultas_blog")
      .select("id, nombre, area, pregunta, respuesta, respondido_por, respondido_at")
      .eq("status", "respondida")
      .not("respuesta", "is", null)
      .order("respondido_at", { ascending: false })
      .limit(60);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Solo primer nombre, por privacidad.
    const safe = (data || []).map((c) => ({
      id: c.id,
      nombre: (c.nombre || "").trim().split(/\s+/)[0] || "Anónimo",
      area: c.area || "General",
      pregunta: c.pregunta || "",
      respuesta: c.respuesta || "",
      respondido_por: c.respondido_por || "Legión Jurídica",
      respondido_at: c.respondido_at,
    }));

    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
