import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MOCK_CASOS } from "@/lib/mock-data";
import { PIPELINES } from "@/lib/pipelines";

export async function POST(request: NextRequest) {
  try {
    const { cedula, clave } = await request.json();

    const supabase = await createClient();
    const { data: suscriptor, error } = await supabase
      .from("suscriptores")
      .select("id, nombre, cedula, plan, estado_pago, clave")
      .eq("cedula", cedula?.trim())
      .single();

    if (error || !suscriptor) {
      return NextResponse.json({ error: "Cedula no encontrada" }, { status: 404 });
    }

    if (!suscriptor.clave || suscriptor.clave !== clave) {
      return NextResponse.json({ error: "Contrasena incorrecta" }, { status: 401 });
    }

    const casos = MOCK_CASOS.filter((c) => c.suscriptor_id === suscriptor.id).map((c) => {
      const pipeline = PIPELINES[c.area];
      const totalStages = pipeline.stages.length;
      const progress = Math.round(((c.etapa_index + 1) / totalStages) * 100);
      return {
        id: c.id,
        titulo: c.titulo,
        area: c.area,
        etapa: c.etapa,
        progreso: `${progress}%`,
        abogado: c.abogado,
        prioridad: c.prioridad,
        descripcion: c.descripcion,
        fecha_limite: c.fecha_limite,
        cerrado: c.etapa === "Cerrado",
      };
    });

    return NextResponse.json({
      nombre: suscriptor.nombre,
      plan: suscriptor.plan,
      estado_pago: suscriptor.estado_pago,
      casos,
    });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
