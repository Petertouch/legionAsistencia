import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { MOCK_CASOS } from "@/lib/mock-data";
import { PIPELINES } from "@/lib/pipelines";
import bcrypt from "bcryptjs";

const CLIENT_AUTH = process.env.CLIENT_AUTH_PROVIDER || process.env.NEXT_PUBLIC_CLIENT_AUTH_PROVIDER || "legacy";

function casosDe(suscriptorId: string) {
  return MOCK_CASOS.filter((c) => c.suscriptor_id === suscriptorId).map((c) => {
    const pipeline = PIPELINES[c.area];
    const totalStages = pipeline.stages.length;
    const progress = Math.round(((c.etapa_index + 1) / totalStages) * 100);
    return {
      id: c.id, titulo: c.titulo, area: c.area, etapa: c.etapa, progreso: `${progress}%`,
      abogado: c.abogado, prioridad: c.prioridad, descripcion: c.descripcion,
      fecha_limite: c.fecha_limite, cerrado: c.etapa === "Cerrado",
    };
  });
}

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
    const body = await request.json();

    // ══ Modo Supabase Auth: por email (no lee suscriptores.clave) ══
    if (CLIENT_AUTH === "supabase") {
      const email = (body.email || "").toLowerCase().trim();
      const clave = body.clave;
      if (!email || !clave) {
        return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
      }
      const ssr = await createServerSupabase();
      const { data, error } = await ssr.auth.signInWithPassword({ email, password: clave });
      if (error || !data.user) {
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
        return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
      }
      const admin = createAdminClient();
      const { data: s } = await admin
        .from("suscriptores").select("id, nombre, plan, estado_pago")
        .eq("auth_user_id", data.user.id).maybeSingle();
      if (!s) {
        return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
      }
      return NextResponse.json({ nombre: s.nombre, plan: s.plan, estado_pago: s.estado_pago, casos: casosDe(s.id) });
    }

    // ══ Modo legacy: por cédula ══
    const { cedula, clave } = body;

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
