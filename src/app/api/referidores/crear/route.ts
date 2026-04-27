import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

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

    // Send welcome email if has email
    if (email?.trim()) {
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://legionjuridica.com"}/api/mail/bienvenida-aliado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          code,
          tipo,
          clave_temporal: tempPassword,
        }),
      }).catch(() => {});
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
