import { NextRequest, NextResponse } from "next/server";
import {
  MOCK_SUSCRIPTORES, MOCK_CASOS,
} from "@/lib/mock-data";
import { PIPELINES } from "@/lib/pipelines";

// Mock passwords — in production this would be hashed in the database
const MOCK_PASSWORDS: Record<string, string> = {
  "123": "123", // Sgto. Juan Felipe Pulido
};

// Default password for suscriptors without a specific one
const DEFAULT_PASSWORD = "legion2026";

export async function POST(request: NextRequest) {
  try {
    const { cedula, clave } = await request.json();

    const suscriptor = MOCK_SUSCRIPTORES.find((s) => s.cedula === cedula?.trim());
    if (!suscriptor) {
      return NextResponse.json({ error: "Cedula no encontrada" }, { status: 404 });
    }

    // Verify password
    const expectedPassword = MOCK_PASSWORDS[suscriptor.cedula] || DEFAULT_PASSWORD;
    if (clave !== expectedPassword) {
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
