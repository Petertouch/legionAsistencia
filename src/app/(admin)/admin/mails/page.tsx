"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type MailCategory,
  type MailTemplate,
} from "@/lib/mail-templates-data";
import {
  Mail, Zap, CheckCircle, XCircle, Pencil, X, Eye, ChevronDown, ChevronRight,
  UserPlus, Scale, Gift, UsersRound, Save, ShieldAlert, Loader2,
} from "lucide-react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<MailCategory, typeof Mail> = {
  suscriptor: UserPlus,
  casos: Scale,
  referidos: Gift,
  equipo: UsersRound,
  seguridad: ShieldAlert,
};

const CATEGORIES: MailCategory[] = ["suscriptor", "casos", "referidos", "equipo", "seguridad"];

// Valores de muestra para la vista previa (deben mostrar los bloques {{#if}}).
const SAMPLE: Record<string, string> = {
  nombre: "Juan Pérez", nombre_familiar: "María Pérez", nombre_suscriptor: "Juan Pérez",
  nombre_referido: "Carlos Díaz", nombre_inscrito: "Juan Pérez", nombre_abogado: "Dra. López",
  email: "juan@ejemplo.com", cedula: "1110448098", plan: "Plan Élite", tipo: "Lanza",
  fecha: "1 de julio de 2026", fecha_vencimiento: "15 de julio de 2026",
  titulo_caso: "Proceso disciplinario", area: "Disciplinario", abogado: "Dra. López",
  etapa: "En proceso", etapa_anterior: "Pendiente", prioridad: "Alta",
  code: "L-A3K9Q2", clave_temporal: "LJ-A3K9Q2", monto: "$50.000", parentesco: "Cónyuge",
  reset_link: "https://legionjuridica.com/reset?token=demo", portal_link: "https://legionjuridica.com/mi-caso",
  codigo: "482913", pregunta: "¿Puedo apelar una sanción disciplinaria?",
  respuesta: "Sí. Tienes 5 días hábiles para presentar el recurso de reposición...",
  respondido_por: "Dra. López",
};

// Render cliente equivalente al del servidor (para la vista previa).
function renderPreview(tpl: string, vars: Record<string, string>): string {
  let out = tpl.replace(
    /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_m, key: string, inner: string) => ((vars[key] ?? "").trim() !== "" ? inner : "")
  );
  for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{{${k}}}`, v ?? "");
  return out.replace(/\{\{[\w.]+\}\}/g, "");
}

export default function MailsPage() {
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<MailCategory | null>("suscriptor");
  const [editForm, setEditForm] = useState({ asunto: "", cuerpo: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mail/templates");
      if (!res.ok) throw new Error();
      setTemplates(await res.json());
    } catch {
      toast.error("No se pudieron cargar las plantillas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEditor = (t: MailTemplate) => {
    setEditForm({ asunto: t.asunto, cuerpo: t.cuerpo });
    setEditing(t.id);
    setPreview(null);
  };

  const patchTemplate = async (slug: string, body: Record<string, unknown>): Promise<MailTemplate | null> => {
    const res = await fetch("/api/mail/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, ...body }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Error al guardar");
      return null;
    }
    const updated: MailTemplate = await res.json();
    setTemplates((prev) => prev.map((t) => (t.slug === slug ? { ...t, ...updated } : t)));
    return updated;
  };

  const saveTemplate = async (t: MailTemplate) => {
    setSaving(true);
    const ok = await patchTemplate(t.slug, { asunto: editForm.asunto, cuerpo: editForm.cuerpo });
    setSaving(false);
    if (ok) {
      setEditing(null);
      toast.success("Plantilla guardada — así se enviará a partir de ahora");
    }
  };

  const handleToggle = async (t: MailTemplate) => {
    const ok = await patchTemplate(t.slug, { activo: !t.activo });
    if (ok) toast.success(`${t.nombre} ${t.activo ? "desactivado" : "activado"}`);
  };

  const toggleCategory = (cat: MailCategory) => {
    setExpandedCat(expandedCat === cat ? null : cat);
    setEditing(null);
    setPreview(null);
  };

  const previewHtml = (cuerpo: string) => renderPreview(cuerpo, SAMPLE);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-lg font-bold flex items-center gap-2">
            <Mail className="w-5 h-5 text-oro" /> Emails
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Lo que edites aquí es exactamente lo que se envía. Cambios en vivo, para todos.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            {templates.filter((t) => t.activo).length} activos
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-gray-400" />
            {templates.filter((t) => !t.activo).length} inactivos
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando plantillas…
        </div>
      ) : (
      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const catTemplates = templates
            .filter((t) => t.categoria === cat)
            .sort((a, b) => a.orden - b.orden);
          if (catTemplates.length === 0) return null;
          const CatIcon = CATEGORY_ICONS[cat];
          const isExpanded = expandedCat === cat;
          const activeCount = catTemplates.filter((t) => t.activo).length;

          return (
            <div key={cat} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${CATEGORY_COLORS[cat]}`}>
                    <CatIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-gray-900 text-sm font-medium">{CATEGORY_LABELS[cat]}</p>
                    <p className="text-gray-400 text-xs">{catTemplates.length} emails · {activeCount} activos</p>
                  </div>
                </div>
                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-gray-400" />
                  : <ChevronRight className="w-4 h-4 text-gray-400" />
                }
              </button>

              {/* Timeline */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="relative ml-[18px] border-l-2 border-gray-200 space-y-0">
                    {catTemplates.map((t, i) => {
                      const isEditing = editing === t.id;
                      const isPreviewing = preview === t.id;
                      const isLast = i === catTemplates.length - 1;

                      return (
                        <div key={t.id} className={`relative pl-7 ${isLast ? "pb-0" : "pb-5"}`}>
                          {/* Timeline dot */}
                          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            t.activo ? "bg-green-500/20 border-green-500" : "bg-gray-50 border-gray-200"
                          }`}>
                            {t.activo && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                          </div>

                          {/* Card */}
                          <div className={`rounded-lg border transition-all ${
                            isEditing ? "bg-white border-oro/30" : "bg-gray-50 border-gray-200 hover:bg-white/[0.05]"
                          }`}>
                            {/* Card header */}
                            <div className="flex items-center justify-between p-3 gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-gray-900 text-sm font-medium truncate">{t.nombre}</p>
                                  {t.activo
                                    ? <Badge size="xs" className="bg-green-50 text-green-600 border-green-200">Activo</Badge>
                                    : <Badge size="xs" className="bg-gray-50 text-gray-400 border-gray-200">Inactivo</Badge>
                                  }
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-xs">
                                  <Zap className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{t.trigger}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => setPreview(isPreviewing ? null : t.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isPreviewing ? "bg-amber-100 text-oro" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                                  }`}
                                  title="Vista previa"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => isEditing ? setEditing(null) : openEditor(t)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isEditing ? "bg-amber-100 text-oro" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                                  }`}
                                  title="Editar"
                                >
                                  {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleToggle(t)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    t.activo ? "text-green-600 hover:text-red-600 hover:bg-red-50" : "text-gray-400 hover:text-green-600 hover:bg-green-500/10"
                                  }`}
                                  title={t.activo ? "Desactivar" : "Activar"}
                                >
                                  {t.activo ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Preview (solo lectura) */}
                            {isPreviewing && !isEditing && (
                              <div className="border-t border-gray-200 p-4 space-y-3">
                                <div>
                                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Asunto</p>
                                  <p className="text-gray-900 text-sm">{renderPreview(t.asunto, SAMPLE)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Vista previa del correo</p>
                                  <div className="rounded-lg overflow-hidden border border-gray-200 bg-[#0f1a0f]">
                                    <div dangerouslySetInnerHTML={{ __html: previewHtml(t.cuerpo) }} />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Variables disponibles</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {t.variables.map((v) => (
                                      <span key={v} className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-50 text-oro/70 border border-gray-200">
                                        {`{{${v}}}`}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Editor con vista previa en vivo */}
                            {isEditing && (
                              <div className="border-t border-oro/20 p-4 space-y-3">
                                <div>
                                  <label className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">Asunto</label>
                                  <input
                                    type="text"
                                    value={editForm.asunto}
                                    onChange={(e) => setEditForm({ ...editForm, asunto: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40"
                                  />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                  {/* HTML */}
                                  <div>
                                    <label className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">Cuerpo (HTML)</label>
                                    <textarea
                                      value={editForm.cuerpo}
                                      onChange={(e) => setEditForm({ ...editForm, cuerpo: e.target.value })}
                                      rows={16}
                                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40 font-mono text-xs leading-relaxed resize-y"
                                    />
                                  </div>
                                  {/* Live preview */}
                                  <div>
                                    <label className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">Vista previa en vivo</label>
                                    <div className="rounded-lg overflow-auto border border-gray-200 bg-[#0f1a0f]" style={{ maxHeight: 420 }}>
                                      <div dangerouslySetInnerHTML={{ __html: previewHtml(editForm.cuerpo) }} />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Insertar variable</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {t.variables.map((v) => (
                                      <button
                                        key={v}
                                        type="button"
                                        onClick={() => setEditForm({ ...editForm, cuerpo: editForm.cuerpo + `{{${v}}}` })}
                                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-50 text-oro/70 border border-gray-200 hover:bg-amber-50 hover:text-oro transition-colors cursor-pointer"
                                        title={`Insertar {{${v}}}`}
                                      >
                                        {`{{${v}}}`}
                                      </button>
                                    ))}
                                  </div>
                                  <p className="text-gray-400 text-[10px] mt-2">
                                    Bloque condicional: <span className="font-mono text-oro/70">{"{{#if clave_temporal}}…{{/if}}"}</span> se muestra solo si la variable tiene valor.
                                  </p>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <Button size="sm" variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
                                    Cancelar
                                  </Button>
                                  <Button size="sm" onClick={() => saveTemplate(t)} disabled={saving}>
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
