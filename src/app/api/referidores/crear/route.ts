import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplate } from "@/lib/mail-templates";
import bcrypt from "bcryptjs";

const ALIADO_AUTH = process.env.ALIADO_AUTH_PROVIDER || process.env.NEXT_PUBLIC_ALIADO_AUTH_PROVIDER || "legacy";

function generateCode(tipo: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const prefixMap: Record<string, string> = { vendedor: "V-", lanza: "L-", esposa: "E-" };
  const prefix = prefixMap[tipo] || `${tipo[0].toUpperCase()}-`;
  return `${prefix}${code}`;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return "LJ-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, nombre, cedula, telefono, email, ciudad, rama, rango, suscriptor_id, comision_personalizada, meta_bono, monto_bono, bono_pagado_at, color, notas } = body;

    if (!nombre || !tipo) {
      return NextResponse.json({ error: "Nombre y tipo son requeridos" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const code = generateCode(tipo);
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const { data, error } = await supabase
      .from("lanzas")
      .insert({
        code,
        tipo,
        nombre: nombre.trim(),
        cedula: cedula?.trim() || "",
        telefono: telefono?.trim() || "",
        email: email?.trim() || "",
        ciudad: ciudad?.trim() || "",
        rama: rama?.trim() || "",
        rango: rango?.trim() || "",
        suscriptor_id: suscriptor_id || null,
        comision_personalizada: comision_personalizada || null,
        meta_bono: meta_bono || null,
        monto_bono: monto_bono || null,
        bono_pagado_at: bono_pagado_at || null,
        color: color || null,
        notas: notas || null,
        status: "activo",
        clave: hashedPassword,
        debe_cambiar_clave: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // En modo Supabase Auth: crear/enlazar el usuario en auth.users (login por email).
    const emailNorm = email?.trim().toLowerCase() || "";
    if (ALIADO_AUTH === "supabase" && emailNorm && data?.id) {
      const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existing = list.users.find((u) => (u.email || "").toLowerCase() === emailNorm);
      if (existing) {
        // Persona que ya tiene cuenta (staff/cliente): una cuenta, varios roles.
        await supabase.from("lanzas").update({ auth_user_id: existing.id }).eq("id", data.id);
        await supabase.auth.admin.updateUserById(existing.id, { app_metadata: { ...existing.app_metadata, es_aliado: true, aliado_profile_id: data.id } });
      } else {
        const { data: created, error: authErr } = await supabase.auth.admin.createUser({
          email: emailNorm,
          password: tempPassword,
          email_confirm: true,
          app_metadata: { role: "aliado", tipo, profile_id: data.id },
          user_metadata: { nombre: nombre.trim() },
        });
        if (!authErr && created?.user) {
          await supabase.from("lanzas").update({ auth_user_id: created.user.id }).eq("id", data.id);
        } else {
          console.error("[referidores/crear] createUser:", authErr?.message);
        }
      }
    }

    // Correo de bienvenida — cuerpo desde la BD (mail_templates → "bienvenida-aliado").
    if (email?.trim()) {
      try {
        const tipoLabel = tipo === "esposa" ? "Aliada" : tipo === "vendedor" ? "Vendedor" : "Lanza";
        await sendTemplate({
          slug: "bienvenida-aliado",
          to: email.trim(),
          force: true,
          variables: {
            nombre: nombre.trim(),
            tipo: tipoLabel,
            code: code || "",
            clave_temporal: tempPassword,
          },
        });
      } catch (mailErr) {
        console.error("[ALIADO MAIL]", mailErr);
      }
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
