import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Rate limit: 3 registers per 15 min per IP
const attempts = new Map<string, number[]>();
const MAX = 3;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, list);
  if (list.length >= MAX) return true;
  list.push(now);
  attempts.set(ip, list);
  return false;
}

function generateCode(tipo: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const prefix = tipo === "esposa" ? "E-" : tipo === "lanza" ? "L-" : `${tipo[0].toUpperCase()}-`;
  return `${prefix}${code}`;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const {
      nombre, cedula, telefono, email, ciudad, rama, rango, tipo,
    } = body;

    if (!nombre || !cedula || !telefono || !tipo) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (!["lanza", "esposa"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check duplicate
    const { data: existing } = await supabase
      .from("lanzas")
      .select("id, code, tipo")
      .eq("cedula", cedula.trim())
      .single();

    if (existing) {
      return NextResponse.json({
        error: "Ya estás registrado. Ingresa al portal con tu cédula.",
        existing: { code: existing.code, tipo: existing.tipo },
      }, { status: 409 });
    }

    const code = generateCode(tipo);

    const { data, error } = await supabase
      .from("lanzas")
      .insert({
        code,
        nombre: nombre.trim(),
        cedula: cedula.trim(),
        telefono: telefono.trim(),
        email: email?.trim() || "",
        ciudad: ciudad?.trim() || "",
        rama: rama || "Civil",
        rango: rango?.trim() || "",
        tipo,
        suscriptor_id: null,
        status: "activo",
        comision_personalizada: null,
        meta_bono: null,
        monto_bono: null,
      })
      .select("id, code, tipo, nombre")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
