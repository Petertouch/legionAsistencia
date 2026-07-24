// ─────────────────────────────────────────────────────────────
// FUENTE ÚNICA de las plantillas de email.
// Este archivo NO tiene dependencias de React/servidor: lo importan
// tanto el admin (cliente) como la capa de envío (servidor).
//
// La BD (tabla `mail_templates`) guarda los OVERRIDES editables
// (asunto/cuerpo/activo). Esta semilla define la estructura
// (nombre, categoría, variables, orden) y sirve de fallback si la
// BD no está disponible → un correo nunca se cae.
// ─────────────────────────────────────────────────────────────

export type MailCategory = "suscriptor" | "casos" | "referidos" | "equipo" | "seguridad";

export interface MailTemplate {
  id: string;
  slug: string;
  nombre: string;
  asunto: string;
  cuerpo: string;
  categoria: MailCategory;
  trigger: string;
  activo: boolean;
  variables: string[];
  orden: number;
  updated_at: string;
}

// ─── Wrapper de diseño compartido ──────────────────────
function wrap(headerIcon: string, headerTitle: string, body: string, footerEmail = "{{email}}") {
  return `<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#0f1a0f;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#1a2e1a 0%,#0f1a0f 100%);padding:24px 32px 16px;text-align:center;border-bottom:2px solid #C8A96E">
    <div style="width:48px;height:48px;margin:0 auto 12px;background:rgba(200,169,110,0.1);border-radius:50%;border:1px solid rgba(200,169,110,0.2);line-height:48px;font-size:22px">${headerIcon}</div>
    <h1 style="margin:0;font-size:18px;font-weight:bold;color:#C8A96E;letter-spacing:1px">${headerTitle}</h1>
    <p style="margin:4px 0 0;font-size:10px;color:rgba(200,169,110,0.4);letter-spacing:2px;text-transform:uppercase">Legión Jurídica</p>
  </div>
  <div style="padding:28px 32px">${body}</div>
  <div style="background:rgba(0,0,0,0.3);padding:16px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05)">
    <p style="margin:0 0 6px;font-size:11px;color:rgba(212,197,160,0.4)">📞 317 668 9580 · ✉️ info@legionjuridica.com</p>
    <p style="margin:0;font-size:10px;color:rgba(212,197,160,0.25)">Legión Jurídica · Cra 7 # 81-49 Of. 301, Bogotá · Enviado a ${footerEmail}</p>
  </div>
</div>`;
}

function infoCard(rows: string) {
  return `<div style="background:rgba(200,169,110,0.08);border:1px solid rgba(200,169,110,0.2);border-radius:10px;padding:16px 20px;margin:16px 0">${rows}</div>`;
}

function row(label: string, value: string) {
  return `<p style="margin:0 0 2px;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">${label}</p><p style="margin:0 0 12px;font-size:15px;color:#ffffff;font-weight:600">${value}</p>`;
}

function btn(text: string, href = "https://legionjuridica.com/mi-caso") {
  return `<div style="text-align:center;padding:20px 0"><a href="${href}" style="display:inline-block;padding:13px 32px;background:#C8A96E;color:#1a1a1a;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;letter-spacing:0.3px">${text}</a></div>`;
}

function greeting(nombre: string) {
  return `<h2 style="margin:0 0 6px;font-size:18px;color:#ffffff;font-weight:bold">Hola, ${nombre}</h2>`;
}

function p(text: string) {
  return `<p style="margin:0 0 16px;font-size:14px;color:rgba(212,197,160,0.65);line-height:1.6">${text}</p>`;
}

function featureRow(icon: string, title: string, desc: string) {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:4px"><tr>
    <td style="width:36px;vertical-align:top;padding:8px 0"><div style="width:30px;height:30px;border-radius:6px;background:rgba(200,169,110,0.1);text-align:center;line-height:30px;font-size:15px">${icon}</div></td>
    <td style="padding:8px 0 8px 10px;border-bottom:1px solid rgba(255,255,255,0.04)"><p style="margin:0;font-size:13px;color:#fff;font-weight:600">${title}</p><p style="margin:2px 0 0;font-size:12px;color:rgba(212,197,160,0.45);line-height:1.4">${desc}</p></td>
  </tr></table>`;
}

// Bloque condicional de credenciales (solo se muestra si hay clave temporal)
function credencialesBlock(usuarioLabel: string, usuarioValue: string) {
  return `{{#if clave_temporal}}<div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);border-radius:10px;padding:16px 20px;margin:16px 0">
    <p style="margin:0 0 10px;font-size:13px;color:#93c5fd;font-weight:bold">🔐 Tus datos de acceso</p>
    <p style="margin:0 0 2px;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">${usuarioLabel}</p>
    <p style="margin:0 0 12px;font-size:15px;color:#ffffff;font-weight:600">${usuarioValue}</p>
    <p style="margin:0 0 2px;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">Clave temporal</p>
    <p style="margin:0 0 8px;font-size:18px;color:#ffffff;font-weight:900;font-family:monospace;letter-spacing:2px">{{clave_temporal}}</p>
    <p style="margin:0;font-size:12px;color:rgba(212,197,160,0.5)">⚠️ La primera vez que ingreses te pediremos cambiarla por una personal.</p>
  </div>{{/if}}`;
}

// ─── Semilla de plantillas ─────────────────────────────
export const SEED_TEMPLATES: MailTemplate[] = [
  // ════════════════════════════════════════
  // SUSCRIPTOR
  // ════════════════════════════════════════
  {
    id: "mail-1", slug: "bienvenida", nombre: "Bienvenida + Contrato",
    asunto: "¡Bienvenido a Legión Jurídica, {{nombre}}!",
    cuerpo: wrap("⚔️", "¡BIENVENIDO!",
      `<h2 style="margin:0 0 6px;font-size:20px;color:#ffffff;font-weight:bold;text-align:center">¡Bienvenido, {{nombre}}!</h2>` +
      `<p style="margin:0 0 20px;font-size:14px;color:rgba(212,197,160,0.6);line-height:1.5;text-align:center">Tu inscripción ha sido aprobada. Ya eres parte de la familia Legión Jurídica.</p>` +
      infoCard(
        `<table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>${row("Tu plan", "{{plan}}")}</td>
          <td style="text-align:right">${row("Activo desde", "{{fecha}}")}</td>
        </tr></table>` +
        `<div style="border-top:1px solid rgba(200,169,110,0.15);padding-top:10px;margin-top:4px">` +
        `<p style="margin:0;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">Estado</p>` +
        `<p style="margin:4px 0 0;font-size:14px;color:#4ade80;font-weight:600">✓ Al día</p></div>`
      ) +
      credencialesBlock("Tu usuario (cédula)", "{{cedula}}") +
      `<h3 style="margin:20px 0 12px;font-size:14px;color:#ffffff;font-weight:bold">¿Qué puedes hacer ahora?</h3>` +
      featureRow("⚖️", "Consultas legales", "Consultas ilimitadas a nuestro equipo de abogados especializados") +
      featureRow("📋", "Seguimiento de casos", "Revisa el estado de tus casos desde tu portal personal") +
      featureRow("🤖", "Asistente IA 24/7", "Accede a nuestro chatbot legal para respuestas inmediatas") +
      `<div style="background:rgba(200,169,110,0.06);border-left:3px solid #C8A96E;padding:12px 16px;margin:16px 0"><p style="margin:0;font-size:13px;color:rgba(212,197,160,0.7);line-height:1.5">📎 <strong style="color:#fff">Tu contrato firmado</strong> va adjunto a este correo en PDF. Guárdalo para tus registros.</p></div>` +
      btn("Ir a mi portal")
    ),
    categoria: "suscriptor", trigger: "Cuando el suscriptor es aprobado / firma su contrato. Adjunta el PDF del contrato.",
    activo: true, variables: ["nombre", "plan", "email", "cedula", "fecha", "clave_temporal"], orden: 1,
    updated_at: "",
  },
  {
    id: "mail-2", slug: "bienvenida-familiar", nombre: "Bienvenida Familiar",
    asunto: "¡Estás protegido(a) por Legión Jurídica, {{nombre_familiar}}!",
    cuerpo: wrap("🛡️", "¡BIENVENIDO A LA FAMILIA!",
      `<h2 style="margin:0 0 6px;font-size:18px;color:#ffffff;font-weight:bold">¡Hola, {{nombre_familiar}}!</h2>` +
      p("<strong>{{nombre_suscriptor}}</strong> ({{parentesco}}) te agregó como beneficiario(a) de su plan <strong style='color:#C8A96E'>{{plan}}</strong>.") +
      p("Esto significa que ahora <strong style='color:#fff'>también cuentas con protección legal</strong>. Nuestro equipo de abogados está disponible para ayudarte.") +
      featureRow("✓", "Estás protegido(a)", "Cobertura legal como beneficiario(a) del plan") +
      featureRow("✓", "Puedes consultar", "Escríbenos por WhatsApp y te atendemos") +
      featureRow("✓", "No tienes que hacer nada", "Tu cobertura ya está activa") +
      btn("Escribirnos por WhatsApp", "https://wa.me/573176689580")
    ),
    categoria: "suscriptor", trigger: "Automático al agregar un familiar/beneficiario con email",
    activo: true, variables: ["nombre_familiar", "nombre_suscriptor", "parentesco", "plan"], orden: 2,
    updated_at: "",
  },
  {
    id: "mail-3", slug: "inscripcion-rechazada", nombre: "Inscripción Rechazada",
    asunto: "Actualización sobre tu solicitud — Legión Jurídica",
    cuerpo: wrap("⚠️", "SOLICITUD NO APROBADA",
      greeting("{{nombre}}") +
      p("Lamentamos informarte que tu solicitud de inscripción no pudo ser procesada en este momento.") +
      `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:14px 16px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:rgba(239,68,68,0.8);line-height:1.5">Si consideras que esto es un error, por favor contáctanos directamente para revisar tu caso.</p>
      </div>` +
      p("Puedes comunicarte con nosotros por WhatsApp al <strong style='color:#fff'>317 668 9580</strong> o escribirnos a <strong style='color:#fff'>info@legionjuridica.com</strong> para más información.") +
      btn("Contáctanos por WhatsApp", "https://wa.me/573176689580")
    ),
    categoria: "suscriptor", trigger: "Cuando el admin rechaza la inscripción",
    activo: false, variables: ["nombre", "email"], orden: 3,
    updated_at: "",
  },
  {
    id: "mail-4", slug: "suscripcion-vencida", nombre: "Suscripción Vencida",
    asunto: "Tu suscripción con Legión Jurídica ha vencido",
    cuerpo: wrap("🔔", "SUSCRIPCIÓN VENCIDA",
      greeting("{{nombre}}") +
      p("Tu suscripción ha vencido. Para seguir contando con asistencia legal especializada, te invitamos a renovar tu plan.") +
      infoCard(
        row("Plan", "{{plan}}") +
        `<p style="margin:0;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">Estado</p>` +
        `<p style="margin:0;font-size:14px;color:#ef4444;font-weight:600">✗ Vencido desde {{fecha_vencimiento}}</p>`
      ) +
      `<div style="background:rgba(200,169,110,0.06);border-left:3px solid #C8A96E;padding:12px 16px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:rgba(212,197,160,0.7);line-height:1.5"><strong style="color:#fff">¿Qué pierdes?</strong> — Sin suscripción activa no podrás acceder a consultas legales, seguimiento de casos ni al asistente IA.</p>
      </div>` +
      btn("Renovar mi plan", "https://wa.me/573176689580?text=Hola,%20quiero%20renovar%20mi%20plan")
    ),
    categoria: "suscriptor", trigger: "Cuando la suscripción pasa a Vencido",
    activo: false, variables: ["nombre", "plan", "fecha_vencimiento"], orden: 4,
    updated_at: "",
  },
  {
    id: "mail-5", slug: "recordatorio-pago", nombre: "Recordatorio de Pago",
    asunto: "⏰ Tu suscripción vence el {{fecha_vencimiento}}",
    cuerpo: wrap("⏰", "RECORDATORIO DE PAGO",
      greeting("{{nombre}}") +
      p("Tu suscripción está próxima a vencer. Realiza tu pago para seguir contando con asistencia legal sin interrupciones.") +
      infoCard(
        `<table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>${row("Plan", "{{plan}}")}</td>
          <td style="text-align:right">${row("Vence el", "{{fecha_vencimiento}}")}</td>
        </tr></table>`
      ) +
      featureRow("✅", "Mantén tu acceso", "Consultas ilimitadas + seguimiento de casos + asistente IA") +
      featureRow("⚡", "Pago rápido", "Contáctanos por WhatsApp para realizar tu pago en minutos") +
      btn("Pagar ahora por WhatsApp", "https://wa.me/573176689580?text=Hola,%20quiero%20renovar%20mi%20plan%20{{plan}}")
    ),
    categoria: "suscriptor", trigger: "7 días antes de que venza la suscripción",
    activo: false, variables: ["nombre", "plan", "fecha_vencimiento"], orden: 5,
    updated_at: "",
  },

  // ════════════════════════════════════════
  // CASOS
  // ════════════════════════════════════════
  {
    id: "mail-6", slug: "caso-creado", nombre: "Caso Creado",
    asunto: "Se ha abierto un nuevo caso: {{titulo_caso}}",
    cuerpo: wrap("⚖️", "NUEVO CASO ABIERTO",
      greeting("{{nombre}}") +
      p("Se ha registrado un nuevo caso legal a tu nombre. Tu abogado ya está trabajando en él.") +
      infoCard(
        row("Caso", "{{titulo_caso}}") +
        `<table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>${row("Área", "{{area}}")}</td>
          <td style="text-align:right">${row("Abogado", "{{abogado}}")}</td>
        </tr></table>` +
        `<p style="margin:0;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">Estado</p>` +
        `<p style="margin:0;font-size:14px;color:#3b82f6;font-weight:600">📂 En proceso</p>`
      ) +
      p("Te mantendremos informado sobre cada avance. Recibirás un email cada vez que tu caso avance de etapa.") +
      btn("Ver mi caso")
    ),
    categoria: "casos", trigger: "Cuando se crea un caso nuevo para el suscriptor",
    activo: true, variables: ["nombre", "titulo_caso", "area", "abogado", "fecha"], orden: 1,
    updated_at: "",
  },
  {
    id: "mail-7", slug: "caso-avanzo", nombre: "Caso Avanzó de Etapa",
    asunto: "📋 Tu caso avanzó: {{titulo_caso}}",
    cuerpo: wrap("📋", "ACTUALIZACIÓN DE CASO",
      greeting("{{nombre}}") +
      p("Tu caso ha avanzado a una nueva etapa. Aquí están los detalles:") +
      infoCard(
        row("Caso", "{{titulo_caso}}") +
        `<table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>
            <p style="margin:0;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">Etapa anterior</p>
            <p style="margin:2px 0 12px;font-size:14px;color:rgba(212,197,160,0.4);text-decoration:line-through">{{etapa_anterior}}</p>
          </td>
          <td style="text-align:center;color:rgba(200,169,110,0.4);font-size:18px">→</td>
          <td style="text-align:right">
            <p style="margin:0;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">Etapa actual</p>
            <p style="margin:2px 0 12px;font-size:14px;color:#4ade80;font-weight:600">{{etapa}}</p>
          </td>
        </tr></table>` +
        row("Abogado a cargo", "{{abogado}}")
      ) +
      p("Si tienes preguntas sobre esta etapa o necesitas información adicional, no dudes en contactarnos.") +
      btn("Ver detalle del caso")
    ),
    categoria: "casos", trigger: "Cuando un caso avanza a la siguiente etapa del pipeline",
    activo: true, variables: ["nombre", "titulo_caso", "etapa", "etapa_anterior", "abogado"], orden: 2,
    updated_at: "",
  },
  {
    id: "mail-8", slug: "caso-cerrado", nombre: "Caso Cerrado",
    asunto: "✅ Tu caso ha sido resuelto: {{titulo_caso}}",
    cuerpo: wrap("✅", "CASO CERRADO",
      greeting("{{nombre}}") +
      p("Nos complace informarte que tu caso ha sido cerrado exitosamente.") +
      infoCard(
        row("Caso", "{{titulo_caso}}") +
        `<table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>${row("Área", "{{area}}")}</td>
          <td style="text-align:right">${row("Abogado", "{{abogado}}")}</td>
        </tr></table>` +
        `<p style="margin:0;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">Estado</p>` +
        `<p style="margin:0;font-size:14px;color:#4ade80;font-weight:600">✅ Cerrado — {{fecha}}</p>`
      ) +
      `<div style="background:rgba(74,222,128,0.06);border-left:3px solid #4ade80;padding:12px 16px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:rgba(212,197,160,0.7);line-height:1.5">Gracias por confiar en Legión Jurídica. Si necesitas asistencia legal en el futuro, estamos a tu disposición.</p>
      </div>` +
      btn("Ver resumen del caso")
    ),
    categoria: "casos", trigger: "Cuando un caso llega a la etapa Cerrado",
    activo: true, variables: ["nombre", "titulo_caso", "area", "abogado", "fecha"], orden: 3,
    updated_at: "",
  },
  {
    id: "mail-9", slug: "consulta-respondida", nombre: "Consulta Respondida (portal)",
    asunto: "Tu consulta ha sido respondida — Legión Jurídica",
    cuerpo: wrap("💬", "CONSULTA RESPONDIDA",
      greeting("{{nombre}}") +
      p("Tu consulta legal ha sido respondida por uno de nuestros abogados.") +
      infoCard(row("Respondida por", "{{abogado}}")) +
      p("Ingresa a tu portal para ver la respuesta completa y, si lo necesitas, hacer preguntas adicionales.") +
      btn("Ver respuesta")
    ),
    categoria: "casos", trigger: "Cuando un abogado responde una consulta del portal",
    activo: false, variables: ["nombre", "abogado"], orden: 4,
    updated_at: "",
  },
  {
    id: "mail-16", slug: "consulta-blog-respuesta", nombre: "Respuesta Consulta Gratuita (blog)",
    asunto: "Respuesta a tu consulta legal — Legión Jurídica",
    cuerpo: wrap("⚖️", "RESPUESTA A TU CONSULTA",
      greeting("{{nombre}}") +
      p("Nuestro equipo jurídico ha respondido tu consulta:") +
      `<div style="background:rgba(255,255,255,0.04);border-left:3px solid rgba(212,197,160,0.4);padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0">
        <p style="margin:0 0 4px;font-size:12px;color:rgba(212,197,160,0.5);font-weight:600">Tu pregunta:</p>
        <p style="margin:0;font-size:13px;color:rgba(212,197,160,0.75);font-style:italic">"{{pregunta}}"</p>
      </div>` +
      `<div style="background:rgba(200,169,110,0.08);border-left:3px solid #C8A96E;padding:16px;margin:16px 0;border-radius:0 8px 8px 0">
        <p style="margin:0 0 6px;font-size:12px;color:rgba(212,197,160,0.5);font-weight:600">Respuesta de {{respondido_por}}:</p>
        <p style="margin:0;font-size:14px;color:#fff;line-height:1.6">{{respuesta}}</p>
      </div>` +
      `<div style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:8px;padding:12px 16px;margin:16px 0">
        <p style="margin:0;font-size:11px;color:rgba(234,179,8,0.8);line-height:1.5"><strong>Nota:</strong> Esta respuesta es orientativa y no constituye asesoría legal formal. Para una asesoría completa y seguimiento de tu caso, conoce nuestros planes.</p>
      </div>` +
      btn("Conocer los planes", "https://legionjuridica.com/#planes")
    ),
    categoria: "casos", trigger: "Cuando un abogado responde una consulta gratuita del blog",
    activo: true, variables: ["nombre", "pregunta", "respuesta", "respondido_por"], orden: 5,
    updated_at: "",
  },

  // ════════════════════════════════════════
  // REFERIDOS
  // ════════════════════════════════════════
  {
    id: "mail-2b", slug: "bienvenida-aliado", nombre: "Bienvenida Aliado",
    asunto: "¡Bienvenido(a) al equipo, {{nombre}}! — Legión Jurídica",
    cuerpo: wrap("🤝", "¡BIENVENIDO AL EQUIPO!",
      `<h2 style="margin:0 0 6px;font-size:18px;color:#ffffff;font-weight:bold">¡Hola, {{nombre}}!</h2>` +
      p("Ya haces parte del equipo de aliados de Legión Jurídica como <strong>{{tipo}}</strong>. Desde ahora puedes ganar dinero recomendando nuestro servicio legal.") +
      featureRow("1️⃣", "Comparte tu link", "Envíalo por WhatsApp a militares y policías") +
      featureRow("2️⃣", "Ellos se registran", "Llenan datos y firman contrato") +
      featureRow("3️⃣", "Tú ganas", "Comisión por cada aprobado") +
      infoCard(row("Tu código de referido", "{{code}}") + row("Tu link", "legionjuridica.com/r/{{code}}")) +
      credencialesBlock("Tu usuario", "tu cédula o correo") +
      btn("Ir a mi panel", "https://legionjuridica.com/aliados")
    ),
    categoria: "referidos", trigger: "Al crear un aliado (admin) o auto-registro por link. Si hay clave temporal, la incluye.",
    activo: true, variables: ["nombre", "tipo", "code", "clave_temporal"], orden: 1,
    updated_at: "",
  },
  {
    id: "mail-10", slug: "referido-registrado", nombre: "Referido Registrado",
    asunto: "Tu referido {{nombre_referido}} ha sido registrado",
    cuerpo: wrap("🤝", "REFERIDO REGISTRADO",
      greeting("{{nombre}}") +
      p("Tu referido ha sido registrado exitosamente en nuestro sistema. Te notificaremos cuando se convierta en suscriptor y ganes tu comisión.") +
      infoCard(
        row("Referido", "{{nombre_referido}}") +
        `<p style="margin:0;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">Estado</p>` +
        `<p style="margin:0;font-size:14px;color:#eab308;font-weight:600">⏳ Pendiente de conversión</p>`
      ) +
      `<div style="background:rgba(200,169,110,0.06);border-left:3px solid #C8A96E;padding:12px 16px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:rgba(212,197,160,0.7);line-height:1.5">💡 <strong style="color:#fff">Tip:</strong> Mientras más referidos traigas, más comisiones ganas. Comparte tu enlace con compañeros que necesiten asistencia legal.</p>
      </div>` +
      btn("Ver mis referidos", "https://legionjuridica.com/aliados")
    ),
    categoria: "referidos", trigger: "Cuando un lanza registra un referido",
    activo: false, variables: ["nombre", "nombre_referido"], orden: 2,
    updated_at: "",
  },
  {
    id: "mail-11", slug: "comision-ganada", nombre: "Comisión Ganada",
    asunto: "🎉 ¡Ganaste una comisión por tu referido!",
    cuerpo: wrap("🎉", "¡COMISIÓN GANADA!",
      greeting("{{nombre}}") +
      p("¡Felicitaciones! Tu referido se convirtió en suscriptor y has ganado una comisión.") +
      infoCard(
        row("Referido convertido", "{{nombre_referido}}") +
        `<p style="margin:0;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">Comisión ganada</p>` +
        `<p style="margin:4px 0 0;font-size:22px;color:#4ade80;font-weight:bold">{{monto}}</p>`
      ) +
      `<div style="background:rgba(74,222,128,0.06);border-left:3px solid #4ade80;padding:12px 16px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:rgba(212,197,160,0.7);line-height:1.5">🚀 Sigue trayendo referidos para ganar más comisiones. Cada compañero que se une suma a tu beneficio.</p>
      </div>` +
      btn("Ver mi panel de referidos", "https://legionjuridica.com/aliados")
    ),
    categoria: "referidos", trigger: "Cuando un referido se convierte en suscriptor",
    activo: false, variables: ["nombre", "nombre_referido", "monto"], orden: 3,
    updated_at: "",
  },

  // ════════════════════════════════════════
  // EQUIPO / ADMIN
  // ════════════════════════════════════════
  {
    id: "mail-12", slug: "nuevo-inscrito-pendiente", nombre: "Nuevo Inscrito Pendiente",
    asunto: "🆕 Nuevo inscrito pendiente: {{nombre_inscrito}}",
    cuerpo: wrap("🆕", "NUEVO INSCRITO",
      `<h2 style="margin:0 0 6px;font-size:18px;color:#ffffff;font-weight:bold">Nuevo inscrito pendiente de aprobación</h2>` +
      p("Alguien completó el registro y firmó su contrato. Revisa la información y decide si apruebas la inscripción.") +
      infoCard(
        row("Nombre", "{{nombre_inscrito}}") +
        `<table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>${row("Cédula", "{{cedula}}")}</td>
          <td style="text-align:right">${row("Plan", "{{plan}}")}</td>
        </tr></table>` +
        row("Fecha de registro", "{{fecha}}")
      ) +
      btn("Revisar en el panel", "https://legionjuridica.com/admin/suscriptores")
    ),
    categoria: "equipo", trigger: "Cuando alguien completa el registro y firma contrato",
    activo: true, variables: ["nombre_inscrito", "cedula", "plan", "fecha"], orden: 1,
    updated_at: "",
  },
  {
    id: "mail-13", slug: "caso-asignado", nombre: "Caso Asignado",
    asunto: "📂 Nuevo caso asignado: {{titulo_caso}}",
    cuerpo: wrap("📂", "CASO ASIGNADO",
      greeting("{{nombre_abogado}}") +
      p("Se te ha asignado un nuevo caso. Revisa los detalles a continuación.") +
      infoCard(
        row("Caso", "{{titulo_caso}}") +
        `<table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>${row("Área", "{{area}}")}</td>
          <td style="text-align:right">${row("Prioridad", "{{prioridad}}")}</td>
        </tr></table>` +
        row("Suscriptor", "{{nombre_suscriptor}}")
      ) +
      p("Ingresa al panel para ver el detalle completo del caso y comenzar a trabajar en él.") +
      btn("Ver caso en el panel", "https://legionjuridica.com/admin/casos")
    ),
    categoria: "equipo", trigger: "Cuando se crea un caso y se asigna a un abogado",
    activo: false, variables: ["nombre_abogado", "titulo_caso", "area", "nombre_suscriptor", "prioridad"], orden: 2,
    updated_at: "",
  },

  // ════════════════════════════════════════
  // SEGURIDAD
  // ════════════════════════════════════════
  {
    id: "mail-14", slug: "recuperar-clave", nombre: "Recuperar Contraseña (link)",
    asunto: "Recuperar contraseña — Legión Jurídica",
    cuerpo: wrap("🔐", "RECUPERAR CONTRASEÑA",
      greeting("{{nombre}}") +
      p("Recibimos una solicitud para restablecer tu contraseña. Haz click en el botón para crear una nueva.") +
      btn("Restablecer contraseña", "{{reset_link}}") +
      `<div style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:8px;padding:14px 16px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:rgba(234,179,8,0.8);line-height:1.5">⏰ Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este email.</p>
      </div>` +
      p("<span style='color:rgba(212,197,160,0.35)'>Si el botón no funciona, copia y pega este enlace:</span><br/><span style='color:rgba(200,169,110,0.5);word-break:break-all;font-size:12px'>{{reset_link}}</span>")
    ),
    categoria: "seguridad", trigger: "Cuando un usuario (staff o cliente) solicita recuperar su contraseña por link",
    activo: true, variables: ["nombre", "reset_link"], orden: 1,
    updated_at: "",
  },
  {
    id: "mail-17", slug: "aliado-recuperar", nombre: "Recuperar Clave Aliado (temporal)",
    asunto: "Tu nueva clave temporal — Legión Jurídica",
    cuerpo: wrap("🔐", "NUEVA CLAVE TEMPORAL",
      greeting("{{nombre}}") +
      p("Recibimos tu solicitud de recuperación de clave. Aquí está tu nueva clave temporal:") +
      `<div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);border-radius:10px;padding:20px;text-align:center;margin:16px 0">
        <p style="margin:0 0 4px;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:1px">Tu nueva clave temporal</p>
        <p style="margin:0;font-size:24px;color:#ffffff;font-weight:900;font-family:monospace;letter-spacing:2px">{{clave_temporal}}</p>
      </div>` +
      p("Ingresa a <a href='https://legionjuridica.com/aliados' style='color:#C8A96E;font-weight:600;text-decoration:none'>legionjuridica.com/aliados</a> con tu correo y esta clave. Te pediremos que la cambies por una personal.") +
      btn("Ir al portal", "https://legionjuridica.com/aliados")
    ),
    categoria: "seguridad", trigger: "Cuando un aliado solicita recuperar su clave (recibe clave temporal, no link)",
    activo: true, variables: ["nombre", "clave_temporal"], orden: 2,
    updated_at: "",
  },
  {
    id: "mail-18", slug: "consulta-blog-codigo", nombre: "Código Consulta Gratuita (blog)",
    asunto: "Confirma tu consulta legal gratuita — Legión Jurídica",
    cuerpo: wrap("✅", "CONFIRMA TU CONSULTA",
      greeting("{{nombre}}") +
      p("Recibimos tu consulta de <strong style='color:#fff'>orientación legal gratuita</strong>. Para confirmar que eres tú, ingresa este código en la página:") +
      `<div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:24px;text-align:center;margin:16px 0">
        <p style="margin:0 0 12px;font-size:11px;color:rgba(212,197,160,0.5);text-transform:uppercase;letter-spacing:1px">Tu código de verificación</p>
        <div style="background:#1a1a1a;color:#C8A96E;font-size:34px;font-weight:900;letter-spacing:10px;padding:16px 24px;border-radius:10px;display:inline-block">{{codigo}}</div>
      </div>` +
      `<div style="background:rgba(59,130,246,0.08);border-left:3px solid #3b82f6;border-radius:0 8px 8px 0;padding:14px 16px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:#93c5fd;line-height:1.6">Vuelve a la página donde estabas, ingresa el código de 6 dígitos y dale clic en <strong>"Verificar y enviar consulta"</strong>. Un abogado te responderá a este correo en un promedio de <strong>8 horas</strong>.</p>
      </div>` +
      p("<span style='color:rgba(212,197,160,0.4);font-size:12px'>Este código expira en 10 minutos. Si no solicitaste esto, ignora este mensaje.</span>")
    ),
    categoria: "seguridad", trigger: "Cuando alguien pide una consulta gratuita en el blog (código de verificación)",
    activo: true, variables: ["nombre", "codigo"], orden: 3,
    updated_at: "",
  },
  {
    id: "mail-15", slug: "clave-actualizada", nombre: "Contraseña Actualizada",
    asunto: "Tu contraseña ha sido actualizada — Legión Jurídica",
    cuerpo: wrap("✅", "CONTRASEÑA ACTUALIZADA",
      greeting("{{nombre}}") +
      p("Tu contraseña ha sido actualizada exitosamente. Ya puedes ingresar con tu nueva clave.") +
      infoCard(
        row("Fecha del cambio", "{{fecha}}") +
        `<p style="margin:0;font-size:11px;color:rgba(212,197,160,0.4);text-transform:uppercase;letter-spacing:0.5px">Estado</p>` +
        `<p style="margin:0;font-size:14px;color:#4ade80;font-weight:600">✓ Contraseña activa</p>`
      ) +
      `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:14px 16px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:rgba(239,68,68,0.8);line-height:1.5">⚠️ Si <strong>no realizaste</strong> este cambio, contacta inmediatamente a info@legionjuridica.com o al 317 668 9580.</p>
      </div>` +
      btn("Ir a mi portal", "{{portal_link}}")
    ),
    categoria: "seguridad", trigger: "Cuando se actualiza la contraseña exitosamente",
    activo: true, variables: ["nombre", "fecha", "portal_link"], orden: 4,
    updated_at: "",
  },
];

export const CATEGORY_LABELS: Record<MailCategory, string> = {
  suscriptor: "Suscriptor",
  casos: "Casos Legales",
  referidos: "Referidos",
  equipo: "Equipo",
  seguridad: "Seguridad",
};

export const CATEGORY_COLORS: Record<MailCategory, string> = {
  suscriptor: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  casos: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  referidos: "text-green-400 bg-green-500/10 border-green-500/20",
  equipo: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  seguridad: "text-red-400 bg-red-500/10 border-red-500/20",
};
