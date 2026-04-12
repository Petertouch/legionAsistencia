"use client";

import { useState, useRef, useCallback } from "react";
import {
  Type, Image, MousePointerClick, Minus, MoveVertical, Heading,
  GripVertical, Trash2, ChevronUp, ChevronDown, Eye, Code,
  Save, Plus, Columns2, Quote,
} from "lucide-react";
import Button from "@/components/ui/button";
import { useMailStore, type MailTemplate } from "@/lib/stores/mail-store";
import { toast } from "sonner";

// ─── Block Types ───────────────────────────────────────
type BlockType = "header" | "text" | "image" | "button" | "divider" | "spacer" | "columns" | "quote";

interface EmailBlock {
  id: string;
  type: BlockType;
  content: string;
  props: Record<string, string>;
}

const BLOCK_CATALOG: { type: BlockType; label: string; icon: typeof Type; description: string }[] = [
  { type: "header", label: "Encabezado", icon: Heading, description: "Título o subtítulo" },
  { type: "text", label: "Texto", icon: Type, description: "Párrafo de texto" },
  { type: "image", label: "Imagen", icon: Image, description: "Imagen con URL" },
  { type: "button", label: "Botón", icon: MousePointerClick, description: "Botón con enlace" },
  { type: "divider", label: "Separador", icon: Minus, description: "Línea horizontal" },
  { type: "spacer", label: "Espaciador", icon: MoveVertical, description: "Espacio vertical" },
  { type: "columns", label: "2 Columnas", icon: Columns2, description: "Texto en dos columnas" },
  { type: "quote", label: "Cita", icon: Quote, description: "Texto destacado" },
];

function createBlock(type: BlockType, overrides?: { content?: string; props?: Record<string, string> }): EmailBlock {
  const id = `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const defaults: Record<BlockType, Partial<EmailBlock>> = {
    header: { content: "Título del email", props: { level: "h1", align: "center", color: "#C8A96E" } },
    text: { content: "Escribe tu texto aquí...", props: { align: "left", color: "#d4c5a0" } },
    image: { content: "", props: { src: "", alt: "Imagen", width: "100%", padding: "12px", rounded: "8" } },
    button: { content: "Click aquí", props: { href: "#", bgColor: "#C8A96E", textColor: "#1a1a1a", align: "center" } },
    divider: { content: "", props: { color: "#333" } },
    spacer: { content: "", props: { height: "24" } },
    columns: { content: "Columna izquierda", props: { right: "Columna derecha", color: "#d4c5a0" } },
    quote: { content: "Texto destacado aquí...", props: { borderColor: "#C8A96E", color: "#d4c5a0" } },
  };
  return {
    id,
    type,
    content: overrides?.content ?? defaults[type]?.content ?? "",
    props: { ...defaults[type]?.props, ...overrides?.props },
  };
}

// ─── Shared builder helpers ────────────────────────────
function headerBlocks(icon: string, title: string) {
  return [
    createBlock("text", { content: icon, props: { align: "center", color: "#C8A96E" } }),
    createBlock("header", { content: title, props: { level: "h1", align: "center", color: "#C8A96E" } }),
    createBlock("text", { content: "Legión Jurídica", props: { align: "center", color: "rgba(200,169,110,0.4)" } }),
    createBlock("divider", { props: { color: "#C8A96E" } }),
  ];
}

function footerBlocks(email = "{{email}}") {
  return [
    createBlock("divider", { props: { color: "rgba(255,255,255,0.05)" } }),
    createBlock("text", { content: `📞 317 668 9580 · ✉️ info@legionjuridica.com`, props: { align: "center", color: "rgba(212,197,160,0.4)" } }),
    createBlock("text", { content: `Legión Jurídica · Cra 7 # 81-49 Of. 301, Bogotá<br/>Enviado a ${email}`, props: { align: "center", color: "rgba(212,197,160,0.25)" } }),
  ];
}

const g = (text: string) => createBlock("header", { content: text, props: { level: "h2", align: "left", color: "#ffffff" } });
const t = (text: string) => createBlock("text", { content: text, props: { align: "left", color: "rgba(212,197,160,0.65)" } });
const tColor = (text: string, color: string) => createBlock("text", { content: text, props: { align: "left", color } });
const cta = (text: string, href: string) => createBlock("button", { content: text, props: { href, bgColor: "#C8A96E", textColor: "#1a1a1a", align: "center" } });
const sep = () => createBlock("divider", { props: { color: "rgba(255,255,255,0.1)" } });
const space = (h = "12") => createBlock("spacer", { props: { height: h } });
const info = (left: string, right: string) => createBlock("columns", { content: left, props: { right, color: "#ffffff" } });
const tip = (text: string, color = "#C8A96E") => createBlock("quote", { content: text, props: { borderColor: color, color: "rgba(212,197,160,0.7)" } });

// ─── Template Presets (bloques pre-armados por plantilla) ──
const TEMPLATE_PRESETS: Record<string, () => EmailBlock[]> = {

  "contrato-firmado": () => [
    ...headerBlocks("📝", "CONTRATO REGISTRADO"),
    g("Hola, {{nombre}}"),
    t("Tu contrato ha sido registrado exitosamente. Nuestro equipo revisará tu inscripción y te notificaremos cuando sea aprobada."),
    info("<strong style='color:#C8A96E'>Plan</strong><br/>{{plan}}", "<strong style='color:#C8A96E'>Cédula</strong><br/>{{cedula}}"),
    tColor("⏳ Pendiente de aprobación", "#eab308"),
    space(),
    tip("⏳ <strong>¿Qué sigue?</strong> — Nuestro equipo verificará tu información y aprobará tu inscripción. Te enviaremos un email de bienvenida cuando esté listo."),
    ...footerBlocks(),
  ],

  "bienvenida": () => [
    ...headerBlocks("⚔️", "¡BIENVENIDO!"),
    createBlock("image", { content: "Logo", props: { src: "https://legionjuridica.com/images/logo.svg", alt: "Legión Jurídica", width: "48px", padding: "8px", rounded: "0" } }),
    createBlock("header", { content: "¡Bienvenido, {{nombre}}!", props: { level: "h2", align: "center", color: "#ffffff" } }),
    t("Tu inscripción ha sido aprobada. Ya eres parte de la familia Legión Jurídica."),
    info("<strong style='color:#C8A96E'>Tu plan</strong><br/>{{plan}}", "<strong style='color:#C8A96E'>Activo desde</strong><br/>{{fecha}}"),
    tColor("✓ Estado: Al día", "#4ade80"),
    sep(),
    createBlock("header", { content: "¿Qué puedes hacer ahora?", props: { level: "h3", align: "left", color: "#ffffff" } }),
    t("⚖️ <strong>Consultas legales</strong> — Consultas ilimitadas a nuestro equipo de abogados"),
    t("📋 <strong>Seguimiento de casos</strong> — Revisa el estado de tus casos desde tu portal"),
    t("🤖 <strong>Asistente IA 24/7</strong> — Chatbot legal para respuestas inmediatas"),
    space(),
    cta("Ir a mi portal", "https://legionjuridica.com/mi-caso"),
    tip("¿Necesitas ayuda?<br/>📞 WhatsApp: 317 668 9580<br/>✉️ info@legionjuridica.com"),
    ...footerBlocks("{{email}}"),
  ],

  "inscripcion-rechazada": () => [
    ...headerBlocks("⚠️", "SOLICITUD NO APROBADA"),
    g("Hola, {{nombre}}"),
    t("Lamentamos informarte que tu solicitud de inscripción no pudo ser procesada en este momento."),
    tip("Si consideras que esto es un error, por favor contáctanos directamente para revisar tu caso.", "#ef4444"),
    t("Puedes comunicarte con nosotros por WhatsApp al <strong style='color:#fff'>317 668 9580</strong> o escribirnos a <strong style='color:#fff'>info@legionjuridica.com</strong>."),
    space(),
    cta("Contáctanos por WhatsApp", "https://wa.me/573176689580"),
    ...footerBlocks("{{email}}"),
  ],

  "suscripcion-vencida": () => [
    ...headerBlocks("🔔", "SUSCRIPCIÓN VENCIDA"),
    g("Hola, {{nombre}}"),
    t("Tu suscripción ha vencido. Para seguir contando con asistencia legal, te invitamos a renovar tu plan."),
    info("<strong style='color:#C8A96E'>Plan</strong><br/>{{plan}}", "<strong style='color:#ef4444'>Vencido desde</strong><br/>{{fecha_vencimiento}}"),
    space(),
    tip("<strong style='color:#fff'>¿Qué pierdes?</strong> — Sin suscripción activa no podrás acceder a consultas legales, seguimiento de casos ni al asistente IA."),
    space(),
    cta("Renovar mi plan", "https://wa.me/573176689580?text=Hola,%20quiero%20renovar%20mi%20plan"),
    ...footerBlocks(),
  ],

  "recordatorio-pago": () => [
    ...headerBlocks("⏰", "RECORDATORIO DE PAGO"),
    g("Hola, {{nombre}}"),
    t("Tu suscripción está próxima a vencer. Realiza tu pago para seguir con asistencia legal sin interrupciones."),
    info("<strong style='color:#C8A96E'>Plan</strong><br/>{{plan}}", "<strong style='color:#eab308'>Vence el</strong><br/>{{fecha_vencimiento}}"),
    sep(),
    t("✅ <strong>Mantén tu acceso</strong> — Consultas + seguimiento de casos + asistente IA"),
    t("⚡ <strong>Pago rápido</strong> — Contáctanos por WhatsApp para pagar en minutos"),
    space(),
    cta("Pagar ahora por WhatsApp", "https://wa.me/573176689580?text=Hola,%20quiero%20renovar%20mi%20plan"),
    ...footerBlocks(),
  ],

  "caso-creado": () => [
    ...headerBlocks("⚖️", "NUEVO CASO ABIERTO"),
    g("Hola, {{nombre}}"),
    t("Se ha registrado un nuevo caso legal a tu nombre. Tu abogado ya está trabajando en él."),
    info("<strong style='color:#C8A96E'>Caso</strong><br/>{{titulo_caso}}", "<strong style='color:#C8A96E'>Área</strong><br/>{{area}}"),
    info("<strong style='color:#C8A96E'>Abogado</strong><br/>{{abogado}}", "<strong style='color:#3b82f6'>Estado</strong><br/>📂 En proceso"),
    space(),
    t("Te mantendremos informado sobre cada avance. Recibirás un email cada vez que tu caso avance de etapa."),
    cta("Ver mi caso", "https://legionjuridica.com/mi-caso"),
    ...footerBlocks("{{email}}"),
  ],

  "caso-avanzo": () => [
    ...headerBlocks("📋", "ACTUALIZACIÓN DE CASO"),
    g("Hola, {{nombre}}"),
    t("Tu caso ha avanzado a una nueva etapa:"),
    info("<strong style='color:#C8A96E'>Caso</strong><br/>{{titulo_caso}}", "<strong style='color:#C8A96E'>Abogado</strong><br/>{{abogado}}"),
    info("<strong style='color:rgba(212,197,160,0.4)'>Etapa anterior</strong><br/><s style='color:rgba(212,197,160,0.4)'>{{etapa_anterior}}</s>", "<strong style='color:#4ade80'>Etapa actual</strong><br/>{{etapa}}"),
    space(),
    t("Si tienes preguntas sobre esta etapa, no dudes en contactarnos."),
    cta("Ver detalle del caso", "https://legionjuridica.com/mi-caso"),
    ...footerBlocks("{{email}}"),
  ],

  "caso-cerrado": () => [
    ...headerBlocks("✅", "CASO CERRADO"),
    g("Hola, {{nombre}}"),
    t("Nos complace informarte que tu caso ha sido cerrado exitosamente."),
    info("<strong style='color:#C8A96E'>Caso</strong><br/>{{titulo_caso}}", "<strong style='color:#C8A96E'>Área</strong><br/>{{area}}"),
    info("<strong style='color:#C8A96E'>Abogado</strong><br/>{{abogado}}", "<strong style='color:#4ade80'>Cerrado</strong><br/>{{fecha}}"),
    space(),
    tip("Gracias por confiar en Legión Jurídica. Si necesitas asistencia legal en el futuro, estamos a tu disposición.", "#4ade80"),
    cta("Ver resumen del caso", "https://legionjuridica.com/mi-caso"),
    ...footerBlocks("{{email}}"),
  ],

  "consulta-respondida": () => [
    ...headerBlocks("💬", "CONSULTA RESPONDIDA"),
    g("Hola, {{nombre}}"),
    t("Tu consulta legal ha sido respondida por uno de nuestros abogados."),
    info("<strong style='color:#C8A96E'>Respondida por</strong><br/>{{abogado}}", ""),
    space(),
    t("Ingresa a tu portal para ver la respuesta completa y, si lo necesitas, hacer preguntas adicionales."),
    cta("Ver respuesta", "https://legionjuridica.com/mi-caso"),
    ...footerBlocks("{{email}}"),
  ],

  "referido-registrado": () => [
    ...headerBlocks("🤝", "REFERIDO REGISTRADO"),
    g("Hola, {{nombre}}"),
    t("Tu referido ha sido registrado exitosamente. Te notificaremos cuando se convierta en suscriptor y ganes tu comisión."),
    info("<strong style='color:#C8A96E'>Referido</strong><br/>{{nombre_referido}}", "<strong style='color:#eab308'>Estado</strong><br/>⏳ Pendiente"),
    space(),
    tip("💡 <strong>Tip:</strong> Mientras más referidos traigas, más comisiones ganas. Comparte tu enlace con compañeros que necesiten asistencia legal."),
    cta("Ver mis referidos", "https://legionjuridica.com/lanzas/panel"),
    ...footerBlocks(),
  ],

  "comision-ganada": () => [
    ...headerBlocks("🎉", "¡COMISIÓN GANADA!"),
    g("Hola, {{nombre}}"),
    t("¡Felicitaciones! Tu referido se convirtió en suscriptor y has ganado una comisión."),
    info("<strong style='color:#C8A96E'>Referido</strong><br/>{{nombre_referido}}", "<strong style='color:#4ade80'>Comisión</strong><br/>{{monto}}"),
    space(),
    tip("🚀 Sigue trayendo referidos para ganar más comisiones. Cada compañero que se une suma a tu beneficio.", "#4ade80"),
    cta("Ver mi panel de referidos", "https://legionjuridica.com/lanzas/panel"),
    ...footerBlocks(),
  ],

  "nuevo-inscrito-pendiente": () => [
    ...headerBlocks("🆕", "NUEVO INSCRITO"),
    createBlock("header", { content: "Nuevo inscrito pendiente de aprobación", props: { level: "h2", align: "left", color: "#ffffff" } }),
    t("Alguien completó el registro y firmó su contrato. Revisa la información y decide si apruebas la inscripción."),
    info("<strong style='color:#C8A96E'>Nombre</strong><br/>{{nombre_inscrito}}", "<strong style='color:#C8A96E'>Cédula</strong><br/>{{cedula}}"),
    info("<strong style='color:#C8A96E'>Plan</strong><br/>{{plan}}", "<strong style='color:#C8A96E'>Fecha</strong><br/>{{fecha}}"),
    space(),
    cta("Revisar en el panel", "https://legionjuridica.com/admin/suscriptores"),
    ...footerBlocks(),
  ],

  "caso-asignado": () => [
    ...headerBlocks("📂", "CASO ASIGNADO"),
    g("Hola, {{nombre_abogado}}"),
    t("Se te ha asignado un nuevo caso. Revisa los detalles a continuación."),
    info("<strong style='color:#C8A96E'>Caso</strong><br/>{{titulo_caso}}", "<strong style='color:#C8A96E'>Área</strong><br/>{{area}}"),
    info("<strong style='color:#C8A96E'>Suscriptor</strong><br/>{{nombre_suscriptor}}", "<strong style='color:#C8A96E'>Prioridad</strong><br/>{{prioridad}}"),
    space(),
    t("Ingresa al panel para ver el detalle completo y comenzar a trabajar en él."),
    cta("Ver caso en el panel", "https://legionjuridica.com/admin/casos"),
    ...footerBlocks(),
  ],

  "recuperar-clave": () => [
    ...headerBlocks("🔐", "RECUPERAR CONTRASEÑA"),
    g("Hola, {{nombre}}"),
    t("Recibimos una solicitud para restablecer tu contraseña. Haz click en el botón para crear una nueva."),
    space(),
    cta("Restablecer contraseña", "{{reset_link}}"),
    createBlock("quote", { content: "⏰ Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este email.", props: { borderColor: "#eab308", color: "rgba(234,179,8,0.8)" } }),
    t("<span style='color:rgba(212,197,160,0.35)'>Si el botón no funciona, copia y pega este enlace:</span><br/><span style='color:rgba(200,169,110,0.5);font-size:12px'>{{reset_link}}</span>"),
    ...footerBlocks(),
  ],

  "clave-actualizada": () => [
    ...headerBlocks("✅", "CONTRASEÑA ACTUALIZADA"),
    g("Hola, {{nombre}}"),
    t("Tu contraseña ha sido actualizada exitosamente. Ya puedes ingresar con tu nueva clave."),
    info("<strong style='color:#C8A96E'>Fecha del cambio</strong><br/>{{fecha}}", "<strong style='color:#4ade80'>Estado</strong><br/>✓ Contraseña activa"),
    space(),
    createBlock("quote", { content: "⚠️ Si <strong>no realizaste</strong> este cambio, contacta inmediatamente a info@legionjuridica.com o al 317 668 9580.", props: { borderColor: "#ef4444", color: "rgba(239,68,68,0.8)" } }),
    cta("Ir a mi portal", "{{portal_link}}"),
    ...footerBlocks(),
  ],
};

function getBlocksForTemplate(slug: string): EmailBlock[] {
  const preset = TEMPLATE_PRESETS[slug];
  if (preset) return preset();
  return [createBlock("header"), createBlock("text"), createBlock("button")];
}

// ─── Block to HTML ─────────────────────────────────────
function blockToHtml(block: EmailBlock): string {
  switch (block.type) {
    case "header": {
      const tag = block.props.level || "h1";
      const size = tag === "h1" ? "24px" : tag === "h2" ? "20px" : "16px";
      return `<${tag} style="margin:0;padding:16px 0 8px;font-size:${size};font-weight:bold;text-align:${block.props.align || "center"};color:${block.props.color || "#C8A96E"}">${block.content}</${tag}>`;
    }
    case "text":
      return `<p style="margin:0;padding:8px 0;font-size:14px;line-height:1.6;text-align:${block.props.align || "left"};color:${block.props.color || "#d4c5a0"}">${block.content}</p>`;
    case "image":
      return block.props.src
        ? `<div style="text-align:center;padding:${block.props.padding || "12px"} 0"><img src="${block.props.src}" alt="${block.props.alt || ""}" width="${block.props.width || "100%"}" style="display:inline-block;width:${block.props.width || "100%"};height:auto;border-radius:${block.props.rounded || "0"}px" /></div>`
        : `<div style="text-align:center;padding:24px;background:#222;border-radius:8px;color:#666;font-size:13px">Imagen (agrega URL)</div>`;
    case "button":
      return `<div style="text-align:${block.props.align || "center"};padding:16px 0"><a href="${block.props.href || "#"}" style="display:inline-block;padding:12px 28px;background:${block.props.bgColor || "#C8A96E"};color:${block.props.textColor || "#1a1a1a"};text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">${block.content}</a></div>`;
    case "divider":
      return `<hr style="border:none;border-top:1px solid ${block.props.color || "#333"};margin:16px 0" />`;
    case "spacer":
      return `<div style="height:${block.props.height || "24"}px"></div>`;
    case "columns":
      return `<table width="100%" cellpadding="0" cellspacing="0" style="padding:8px 0"><tr><td width="50%" style="vertical-align:top;padding-right:8px;font-size:14px;line-height:1.6;color:${block.props.color || "#d4c5a0"}">${block.content}</td><td width="50%" style="vertical-align:top;padding-left:8px;font-size:14px;line-height:1.6;color:${block.props.color || "#d4c5a0"}">${block.props.right || ""}</td></tr></table>`;
    case "quote":
      return `<div style="border-left:3px solid ${block.props.borderColor || "#C8A96E"};padding:12px 16px;margin:12px 0;font-style:italic;color:${block.props.color || "#d4c5a0"};font-size:14px;line-height:1.6">${block.content}</div>`;
    default:
      return "";
  }
}

function blocksToFullHtml(blocks: EmailBlock[]): string {
  const inner = blocks.map(blockToHtml).join("\n");
  return `<div style="max-width:600px;margin:0 auto;background:#0f1a0f;border-radius:12px;padding:32px;font-family:Arial,Helvetica,sans-serif;overflow:hidden">\n${inner}\n</div>`;
}

// ─── Block Editor Panel ────────────────────────────────
function BlockEditor({ block, onChange }: { block: EmailBlock; onChange: (b: EmailBlock) => void }) {
  const update = (field: string, value: string) => {
    onChange({ ...block, props: { ...block.props, [field]: value } });
  };
  const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-oro/40";
  const labelCls = "text-gray-400 text-[10px] uppercase tracking-wider mb-1 block";

  return (
    <div className="space-y-2.5">
      {/* Content field for most blocks */}
      {!["divider", "spacer"].includes(block.type) && (
        <div>
          <label className={labelCls}>
            {block.type === "image" ? "Alt text" : block.type === "button" ? "Texto del botón" : "Contenido"}
          </label>
          {block.type === "text" || block.type === "quote" ? (
            <textarea
              value={block.content}
              onChange={(e) => onChange({ ...block, content: e.target.value })}
              rows={3}
              className={`${inputCls} resize-y`}
            />
          ) : (
            <input
              type="text"
              value={block.content}
              onChange={(e) => onChange({ ...block, content: e.target.value })}
              className={inputCls}
            />
          )}
        </div>
      )}

      {/* Type-specific fields */}
      {block.type === "header" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Nivel</label>
            <select value={block.props.level} onChange={(e) => update("level", e.target.value)} className={inputCls}>
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Alineación</label>
            <select value={block.props.align} onChange={(e) => update("align", e.target.value)} className={inputCls}>
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </div>
        </div>
      )}

      {block.type === "text" && (
        <div>
          <label className={labelCls}>Alineación</label>
          <select value={block.props.align} onChange={(e) => update("align", e.target.value)} className={inputCls}>
            <option value="left">Izquierda</option>
            <option value="center">Centro</option>
            <option value="right">Derecha</option>
          </select>
        </div>
      )}

      {block.type === "image" && (
        <>
          <div>
            <label className={labelCls}>URL de imagen</label>
            <input
              type="url"
              value={block.props.src}
              onChange={(e) => update("src", e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Ancho</label>
              <input type="text" value={block.props.width} onChange={(e) => update("width", e.target.value)} placeholder="100% o 120px" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Padding</label>
              <input type="text" value={block.props.padding} onChange={(e) => update("padding", e.target.value)} placeholder="12px" className={inputCls} />
            </div>
          </div>
        </>
      )}

      {block.type === "button" && (
        <>
          <div>
            <label className={labelCls}>URL del enlace</label>
            <input type="url" value={block.props.href} onChange={(e) => update("href", e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Color fondo</label>
              <input type="color" value={block.props.bgColor} onChange={(e) => update("bgColor", e.target.value)} className="w-full h-8 rounded cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className={labelCls}>Color texto</label>
              <input type="color" value={block.props.textColor} onChange={(e) => update("textColor", e.target.value)} className="w-full h-8 rounded cursor-pointer bg-transparent" />
            </div>
          </div>
        </>
      )}

      {block.type === "spacer" && (
        <div>
          <label className={labelCls}>Altura (px)</label>
          <input type="number" value={block.props.height} onChange={(e) => update("height", e.target.value)} min="8" max="120" className={inputCls} />
        </div>
      )}

      {block.type === "columns" && (
        <div>
          <label className={labelCls}>Columna derecha</label>
          <textarea
            value={block.props.right}
            onChange={(e) => update("right", e.target.value)}
            rows={3}
            className={`${inputCls} resize-y`}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Builder Component ────────────────────────────
export default function MailBuilder() {
  const { templates, updateTemplate } = useMailStore();
  const bienvenidaTemplate = templates.find((t) => t.slug === "bienvenida");
  const defaultId = bienvenidaTemplate?.id || templates[0]?.id || "";
  const defaultSlug = bienvenidaTemplate?.slug || templates[0]?.slug || "";
  const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultId);
  const [blocks, setBlocks] = useState<EmailBlock[]>(getBlocksForTemplate(defaultSlug));
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragOverRef = useRef<number | null>(null);

  // ── Drag from catalog (new block) ──
  const handleCatalogDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData("blockType", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  // ── Drag to reorder existing blocks ──
  const handleBlockDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("reorderIndex", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDragIndex(index);
  };

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes("blocktype") ? "copy" : "move";
    dragOverRef.current = index;
    setDropIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragIndex(null);
    setDropIndex(null);

    // New block from catalog
    const blockType = e.dataTransfer.getData("blockType") as BlockType;
    if (blockType) {
      const newBlock = createBlock(blockType);
      setBlocks((prev) => {
        const next = [...prev];
        next.splice(index, 0, newBlock);
        return next;
      });
      setSelectedBlock(newBlock.id);
      return;
    }

    // Reorder
    const fromStr = e.dataTransfer.getData("reorderIndex");
    if (fromStr !== "") {
      const from = Number(fromStr);
      setBlocks((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        const adjustedIndex = from < index ? index - 1 : index;
        next.splice(adjustedIndex, 0, moved);
        return next;
      });
    }
  }, []);

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropIndex(blocks.length);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragIndex(null);
    setDropIndex(null);
    const blockType = e.dataTransfer.getData("blockType") as BlockType;
    if (blockType) {
      const newBlock = createBlock(blockType);
      setBlocks((prev) => [...prev, newBlock]);
      setSelectedBlock(newBlock.id);
    }
  };

  // ── Block operations ──
  const updateBlock = (id: string, updated: EmailBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[index], next[newIdx]] = [next[newIdx], next[index]];
      return next;
    });
  };

  const addBlockAt = (type: BlockType, index: number) => {
    const newBlock = createBlock(type);
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newBlock);
      return next;
    });
    setSelectedBlock(newBlock.id);
  };

  // ── Save to template ──
  const saveToTemplate = () => {
    if (!selectedTemplate) {
      toast.error("Selecciona una plantilla");
      return;
    }
    const html = blocksToFullHtml(blocks);
    updateTemplate(selectedTemplate, { cuerpo: html });
    toast.success("Diseño guardado en la plantilla");
  };

  // ── Load from template ──
  const loadFromTemplate = (id: string) => {
    setSelectedTemplate(id);
    const tmpl = templates.find((t) => t.id === id);
    setBlocks(getBlocksForTemplate(tmpl?.slug || ""));
    setSelectedBlock(null);
    setShowPreview(false);
    setShowCode(false);
  };

  const currentBlock = blocks.find((b) => b.id === selectedBlock);
  const fullHtml = blocksToFullHtml(blocks);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={selectedTemplate}
            onChange={(e) => loadFromTemplate(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-900 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40 max-w-[220px]"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id} className="bg-white">{t.nombre}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowPreview(!showPreview); setShowCode(false); }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              showPreview ? "bg-amber-100 text-oro border-oro/30" : "text-gray-400 border-gray-200 hover:text-gray-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => { setShowCode(!showCode); setShowPreview(false); }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              showCode ? "bg-amber-100 text-oro border-oro/30" : "text-gray-400 border-gray-200 hover:text-gray-900"
            }`}
          >
            <Code className="w-3.5 h-3.5" /> HTML
          </button>
          <Button size="sm" onClick={saveToTemplate}>
            <Save className="w-3.5 h-3.5" /> Guardar en plantilla
          </Button>
        </div>
      </div>

      {/* Preview / Code */}
      {showPreview && (
        <div className="bg-[#111] border border-gray-200 rounded-xl p-6 overflow-auto">
          <div dangerouslySetInnerHTML={{ __html: fullHtml }} />
        </div>
      )}
      {showCode && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-auto max-h-[300px]">
          <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap break-all">{fullHtml}</pre>
        </div>
      )}

      {/* Builder: 3-column layout */}
      <div className="grid grid-cols-12 gap-3" style={{ minHeight: "500px" }}>
        {/* Left: Block catalog */}
        <div className="col-span-3 bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider font-medium mb-2">Bloques</p>
          {BLOCK_CATALOG.map(({ type, label, icon: Icon, description }) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleCatalogDragStart(e, type)}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-200 cursor-grab hover:bg-white hover:border-gray-200 transition-colors active:cursor-grabbing"
            >
              <div className="w-7 h-7 rounded bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-oro/70" />
              </div>
              <div className="min-w-0">
                <p className="text-gray-900 text-xs font-medium">{label}</p>
                <p className="text-gray-400 text-[10px] truncate">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Center: Canvas */}
        <div
          className="col-span-6 bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-y-auto"
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
        >
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <Plus className="w-8 h-8 text-beige/15 mb-3" />
              <p className="text-gray-400 text-sm">Arrastra bloques aquí</p>
              <p className="text-gray-300 text-xs mt-1">o haz click en + para agregar</p>
            </div>
          ) : (
            <div className="space-y-0">
              {blocks.map((block, index) => {
                const isSelected = selectedBlock === block.id;
                const isDragging = dragIndex === index;
                const isDropTarget = dropIndex === index;
                const BlockIcon = BLOCK_CATALOG.find((c) => c.type === block.type)?.icon || Type;

                return (
                  <div key={block.id}>
                    {/* Drop indicator */}
                    {isDropTarget && !isDragging && (
                      <div className="h-0.5 bg-oro/60 rounded-full mx-2 my-1" />
                    )}

                    <div
                      draggable
                      onDragStart={(e) => handleBlockDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={() => { setDragIndex(null); setDropIndex(null); }}
                      onClick={() => setSelectedBlock(isSelected ? null : block.id)}
                      className={`group relative rounded-lg border transition-all cursor-pointer ${
                        isDragging
                          ? "opacity-30"
                          : isSelected
                          ? "border-oro/40 bg-white/[0.05]"
                          : "border-transparent hover:border-gray-200 bg-transparent"
                      }`}
                    >
                      {/* Block toolbar (visible on hover or selected) */}
                      <div className={`absolute -top-2.5 right-2 flex items-center gap-0.5 bg-white border border-gray-200 rounded-md px-0.5 py-0.5 z-10 ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      } transition-opacity`}>
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(index, -1); }} className="p-0.5 text-gray-400 hover:text-gray-900" title="Subir">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(index, 1); }} className="p-0.5 text-gray-400 hover:text-gray-900" title="Bajar">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className="p-0.5 text-gray-400 hover:text-red-600" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Grip + type label */}
                      <div className="flex items-center gap-1.5 px-2 pt-2 pb-1">
                        <GripVertical className="w-3 h-3 text-gray-300 cursor-grab" />
                        <BlockIcon className="w-3 h-3 text-gray-300" />
                        <span className="text-gray-300 text-[9px] uppercase tracking-wider">
                          {BLOCK_CATALOG.find((c) => c.type === block.type)?.label}
                        </span>
                      </div>

                      {/* Block preview */}
                      <div className="px-3 pb-3">
                        <div
                          className="[&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_p]:text-sm [&_a]:inline-block [&_img]:max-w-full [&_img]:rounded-lg"
                          dangerouslySetInnerHTML={{ __html: blockToHtml(block) }}
                        />
                      </div>
                    </div>

                    {/* Add block button between blocks */}
                    <div className="flex justify-center py-1 opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity">
                      <button
                        onClick={() => addBlockAt("text", index)}
                        className="w-5 h-5 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-oro hover:border-oro/30 transition-colors"
                        title="Agregar bloque"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Properties panel */}
        <div className="col-span-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
          {currentBlock ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Propiedades</p>
                <span className="text-amber-600/50 text-[10px] font-mono">
                  {BLOCK_CATALOG.find((c) => c.type === currentBlock.type)?.label}
                </span>
              </div>
              <BlockEditor
                block={currentBlock}
                onChange={(updated) => updateBlock(currentBlock.id, updated)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <MousePointerClick className="w-6 h-6 text-beige/15 mb-2" />
              <p className="text-gray-400 text-xs">Selecciona un bloque</p>
              <p className="text-gray-300 text-[10px] mt-1">para editar sus propiedades</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
