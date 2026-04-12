import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOCK_CASOS } from "@/lib/mock-data";
import { PIPELINES } from "@/lib/pipelines";
import bcrypt from "bcryptjs";

// Rate limiting: 5 attempts per 15 minutes per IP
const loginAttempts = new Map<string, number[]>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = (loginAttempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  loginAttempts.set(ip, attempts);
  if (attempts.length >= MAX_ATTEMPTS) return true;
  attempts.push(now);
  loginAttempts.set(ip, attempts);
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
  }

  try {
    const { cedula, clave } = await request.json();

    const supabase = createAdminClient();
    const { data: suscriptor, error } = await supabase
      .from("suscriptores")
      .select("id, nombre, cedula, plan, estado_pago, clave")
      .eq("cedula", cedula?.trim())
      .single();

    if (error || !suscriptor || !suscriptor.clave) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ error: "Cédula o contraseña incorrectos" }, { status: 401 });
    }

    // Support both bcrypt hashed and plaintext (for migration)
    const isHash = suscriptor.clave.startsWith("$2");
    const matches = isHash
      ? await bcrypt.compare(clave, suscriptor.clave)
      : suscriptor.clave === clave;

    if (!matches) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ error: "Cédula o contraseña incorrectos" }, { status: 401 });
    }

    // Lazy migration: hash plaintext password on successful login
    if (!isHash) {
      const hashed = await bcrypt.hash(clave, 12);
      await supabase.from("suscriptores").update({ clave: hashed }).eq("id", suscriptor.id);
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
