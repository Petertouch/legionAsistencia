import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "node:crypto";

// Normaliza el parentesco a las opciones que maneja el portal.
function normParentesco(p: string): string {
  const s = (p || "").toLowerCase();
  if (/(esposa|esposo|c[oó]nyuge|pareja)/.test(s)) return "Cónyuge";
  if (/hij/.test(s)) return "Hijo(a)";
  if (/madre/.test(s)) return "Madre";
  if (/padre/.test(s)) return "Padre";
  if (/(hermano|hermana)/.test(s)) return "Hermano(a)";
  return p || "Otro";
}

interface BenefIn { nombre: string; edad?: string | number | null; parentesco?: string; telefono?: string }

// POST: crea un afiliado desde una ficha revisada por el admin.
// Crea contrato + suscriptor (estado "Pendiente", SIN clave, SIN auth) + beneficiarios.
// NO envía ningún correo.
export async function POST(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await request.json();
    const nombre = String(body.nombre || "").trim();
    const cedula = String(body.cedula || "").replace(/\D/g, "");
    if (!nombre || !cedula) {
      return NextResponse.json({ error: "Nombre y cédula son obligatorios" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Evitar duplicados por cédula
    const { data: existe } = await supabase
      .from("suscriptores").select("id").eq("cedula", cedula).maybeSingle();
    if (existe) {
      return NextResponse.json({ error: `Ya existe un suscriptor con la cédula ${cedula}` }, { status: 409 });
    }

    const telefono = String(body.telefono || "").trim();
    const telefono2 = String(body.telefono2 || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const plan = String(body.plan || "Base").trim();
    const precio = String(body.precio || "").trim();
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(body.fecha) ? body.fecha : new Date().toISOString().slice(0, 10);
    const fechaIso = `${fecha}T12:00:00.000Z`;
    const beneficiarios: BenefIn[] = Array.isArray(body.beneficiarios) ? body.beneficiarios : [];
    const dudas = Array.isArray(body.confianza_baja) ? body.confianza_baja.filter(Boolean) : [];

    const hash = crypto.createHash("sha256").update(`${nombre}|${cedula}|${fecha}`).digest("hex");

    // 1) Contrato
    const { data: contrato, error: cErr } = await supabase
      .from("contratos")
      .insert({
        lead_id: null,
        nombre, cedula, telefono, telefono2: telefono2 || null, email: email || null,
        estado_civil: body.estado_civil || null, grado: body.grado || null,
        fuerza: body.fuerza || null, unidad: body.unidad || null,
        direccion: body.direccion || null, ciudad: body.ciudad || null,
        plan, precio, firma_data: "", foto_data: null, hash,
        nombre_cliente: nombre, cedula_cliente: cedula,
        datos_completos: {
          departamento: body.departamento || null,
          origen: "carga_admin",
          pdf_bucket: body.pdf_bucket || "contratos",
          pdf_original_path: body.pdf_original_path || null,
          pdf_filename: body.pdf_filename || null,
          beneficiarios: beneficiarios.map((b) => ({
            nombre: b.nombre, edad: b.edad ?? "", parentesco: b.parentesco || "",
          })),
        },
        created_at: fechaIso,
      })
      .select("id")
      .single();
    if (cErr) return NextResponse.json({ error: "contrato: " + cErr.message }, { status: 500 });

    // 2) Suscriptor (Pendiente, sin clave, sin auth -> sin acceso al portal; sin correo)
    const notas =
      `Cargado desde contrato físico${body.pdf_filename ? ` (${body.pdf_filename})` : ""}. Sin correo enviado.` +
      (dudas.length ? ` ⚠ Verificar: ${dudas.join(", ")}.` : "");
    const { data: sus, error: sErr } = await supabase
      .from("suscriptores")
      .insert({
        nombre, telefono, email: email || null, cedula, plan,
        estado_pago: "Pendiente", rama: body.fuerza || "", rango: body.grado || "",
        fecha_inicio: fechaIso, notas, contrato_id: contrato.id,
        clave: null, debe_cambiar_clave: true, created_at: fechaIso,
      })
      .select("id")
      .single();
    if (sErr) return NextResponse.json({ error: "suscriptor: " + sErr.message }, { status: 500 });

    // 3) Beneficiarios (inactivos mientras el suscriptor esté Pendiente)
    let benOk = 0;
    for (const b of beneficiarios) {
      if (!b.nombre) continue;
      let cedBen: string | null = null;
      for (let intento = 0; intento < 2; intento++) {
        const { error: bErr } = await supabase.from("beneficiarios").insert({
          suscriptor_id: sus.id, nombre: b.nombre, parentesco: normParentesco(b.parentesco || ""),
          cedula: cedBen, email: null, telefono: b.telefono || null, activo: false,
        });
        if (!bErr) { benOk++; break; }
        if (/null/i.test(bErr.message) && cedBen === null) {
          cedBen = "S/C-" + Math.random().toString(36).slice(2, 8);
          continue;
        }
        break;
      }
    }

    return NextResponse.json({
      ok: true,
      contrato_id: contrato.id,
      suscriptor_id: sus.id,
      beneficiarios: benOk,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error del servidor" }, { status: 500 });
  }
}
