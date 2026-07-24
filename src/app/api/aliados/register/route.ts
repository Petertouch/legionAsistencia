import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import bcrypt from "bcryptjs";

const ALIADO_AUTH = process.env.ALIADO_AUTH_PROVIDER || process.env.NEXT_PUBLIC_ALIADO_AUTH_PROVIDER || "legacy";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return "LJ-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

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

    const emailNorm = email?.trim().toLowerCase() || "";
    // En modo Supabase Auth el email es obligatorio (es el usuario de login).
    if (ALIADO_AUTH === "supabase" && !emailNorm) {
      return NextResponse.json({ error: "El correo es obligatorio para tu registro" }, { status: 400 });
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
    const useSupabase = ALIADO_AUTH === "supabase";
    const tempPassword = generateTempPassword();

    const { data, error } = await supabase
      .from("lanzas")
      .insert({
        code,
        nombre: nombre.trim(),
        cedula: cedula.trim(),
        telefono: telefono.trim(),
        email: emailNorm,
        ciudad: ciudad?.trim() || "",
        rama: rama || "Civil",
        rango: rango?.trim() || "",
        tipo,
        suscriptor_id: null,
        status: "activo",
        comision_personalizada: null,
        meta_bono: null,
        monto_bono: null,
        // En modo Supabase: clave temporal (bcrypt) + obligar cambio.
        ...(useSupabase ? { clave: await bcrypt.hash(tempPassword, 12), debe_cambiar_clave: true } : {}),
      })
      .select("id, code, tipo, nombre")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // En modo Supabase Auth: crear/enlazar el usuario y avisar la clave temporal por correo.
    if (useSupabase && data?.id) {
      const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existing = list.users.find((u) => (u.email || "").toLowerCase() === emailNorm);
      if (existing) {
        await supabase.from("lanzas").update({ auth_user_id: existing.id }).eq("id", data.id);
        await supabase.auth.admin.updateUserById(existing.id, { app_metadata: { ...existing.app_metadata, es_aliado: true, aliado_profile_id: data.id } });
      } else {
        const { data: created } = await supabase.auth.admin.createUser({
          email: emailNorm,
          password: tempPassword,
          email_confirm: true,
          app_metadata: { role: "aliado", tipo, profile_id: data.id },
          user_metadata: { nombre: nombre.trim() },
        });
        if (created?.user) {
          await supabase.from("lanzas").update({ auth_user_id: created.user.id }).eq("id", data.id);
          const firstName = nombre.trim().split(" ")[0];
          await sendMail({
            to: emailNorm,
            subject: "Tu acceso al portal de aliados — Legión Jurídica",
            html: `<div style="max-width:520px;margin:0 auto;font-family:Arial,sans-serif">
              <div style="background:#1a1a1a;border-radius:12px 12px 0 0;padding:24px;text-align:center">
                <h1 style="margin:0;font-size:16px;color:#C8A96E;letter-spacing:2px">LEGIÓN JURÍDICA</h1>
              </div>
              <div style="background:#fff;padding:28px;border:1px solid #eee">
                <h2 style="margin:0 0 8px;font-size:18px;color:#1a1a1a">¡Bienvenido(a), ${firstName}!</h2>
                <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6">Ya puedes ingresar al portal de aliados con tu correo y esta clave temporal:</p>
                <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;text-align:center;margin-bottom:16px">
                  <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase">Clave temporal</p>
                  <p style="margin:0;font-size:22px;color:#1a1a1a;font-weight:900;font-family:monospace;letter-spacing:2px">${tempPassword}</p>
                </div>
                <p style="margin:0 0 16px;font-size:13px;color:#777">Entra en <a href="https://legionjuridica.com/aliados" style="color:#C8A96E;font-weight:600">legionjuridica.com/aliados</a> con tu correo. Te pediremos cambiarla la primera vez.</p>
              </div>
            </div>`,
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
