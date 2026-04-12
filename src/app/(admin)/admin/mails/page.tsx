"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  useMailStore,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type MailCategory,
  type MailTemplate,
} from "@/lib/stores/mail-store";
import {
  Mail, Zap, CheckCircle, XCircle, Pencil, X, Eye, ChevronDown, ChevronRight,
  UserPlus, Scale, Gift, UsersRound, Save, LayoutGrid, Workflow, ShieldAlert,
} from "lucide-react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { toast } from "sonner";

const MailBuilder = dynamic(() => import("@/components/admin/mail-builder"), { ssr: false });

type MailTab = "plantillas" | "editor";

const CATEGORY_ICONS: Record<MailCategory, typeof Mail> = {
  suscriptor: UserPlus,
  casos: Scale,
  referidos: Gift,
  equipo: UsersRound,
  seguridad: ShieldAlert,
};

const CATEGORIES: MailCategory[] = ["suscriptor", "casos", "referidos", "equipo", "seguridad"];

export default function MailsPage() {
  const { templates, updateTemplate, toggleActive } = useMailStore();
  const [tab, setTab] = useState<MailTab>("plantillas");
  const [editing, setEditing] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<MailCategory | null>("suscriptor");

  // ── Editor state ──
  const [editForm, setEditForm] = useState({ asunto: "", cuerpo: "" });

  const openEditor = (t: MailTemplate) => {
    setEditForm({ asunto: t.asunto, cuerpo: t.cuerpo });
    setEditing(t.id);
    setPreview(null);
  };

  const saveTemplate = (id: string) => {
    updateTemplate(id, { asunto: editForm.asunto, cuerpo: editForm.cuerpo });
    setEditing(null);
    toast.success("Plantilla guardada");
  };

  const handleToggle = (id: string, nombre: string, activo: boolean) => {
    toggleActive(id);
    toast.success(`${nombre} ${activo ? "desactivado" : "activado"}`);
  };

  const toggleCategory = (cat: MailCategory) => {
    setExpandedCat(expandedCat === cat ? null : cat);
    setEditing(null);
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-lg font-bold flex items-center gap-2">
            <Mail className="w-5 h-5 text-oro" /> Emails
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Gestiona las plantillas de email que se envían automáticamente
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
        <button
          onClick={() => setTab("plantillas")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "plantillas"
              ? "bg-amber-100 text-oro border border-oro/30"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent"
          }`}
        >
          <Workflow className="w-4 h-4" />
          Plantillas
        </button>
        <button
          onClick={() => setTab("editor")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "editor"
              ? "bg-amber-100 text-oro border border-oro/30"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Editor Visual
        </button>
      </div>

      {/* Tab: Editor */}
      {tab === "editor" && <MailBuilder />}

      {/* Tab: Timeline by category */}
      {tab === "plantillas" && <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const catTemplates = templates
            .filter((t) => t.categoria === cat)
            .sort((a, b) => a.orden - b.orden);
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
                    <CatIcon className="w-4.5 h-4.5" />
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
                            t.activo
                              ? "bg-green-500/20 border-green-500"
                              : "bg-gray-50 border-gray-200"
                          }`}>
                            {t.activo && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                          </div>

                          {/* Card */}
                          <div className={`rounded-lg border transition-all ${
                            isEditing
                              ? "bg-white border-oro/30"
                              : "bg-gray-50 border-gray-200 hover:bg-white/[0.05]"
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
                                    isPreviewing
                                      ? "bg-amber-100 text-oro"
                                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                                  }`}
                                  title="Vista previa"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => isEditing ? setEditing(null) : openEditor(t)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isEditing
                                      ? "bg-amber-100 text-oro"
                                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                                  }`}
                                  title="Editar"
                                >
                                  {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleToggle(t.id, t.nombre, t.activo)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    t.activo
                                      ? "text-green-600 hover:text-red-600 hover:bg-red-50"
                                      : "text-gray-400 hover:text-green-600 hover:bg-green-500/10"
                                  }`}
                                  title={t.activo ? "Desactivar" : "Activar"}
                                >
                                  {t.activo
                                    ? <CheckCircle className="w-4 h-4" />
                                    : <XCircle className="w-4 h-4" />
                                  }
                                </button>
                              </div>
                            </div>

                            {/* Preview */}
                            {isPreviewing && !isEditing && (
                              <div className="border-t border-gray-200 p-4 space-y-3">
                                <div>
                                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Asunto</p>
                                  <p className="text-gray-900 text-sm">{t.asunto}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Cuerpo</p>
                                  <div
                                    className="text-gray-600 text-sm leading-relaxed prose-sm [&_strong]:text-gray-900 [&_p]:mb-2"
                                    dangerouslySetInnerHTML={{ __html: t.cuerpo }}
                                  />
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

                            {/* Editor */}
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
                                <div>
                                  <label className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">Cuerpo (HTML)</label>
                                  <textarea
                                    value={editForm.cuerpo}
                                    onChange={(e) => setEditForm({ ...editForm, cuerpo: e.target.value })}
                                    rows={8}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40 font-mono text-xs leading-relaxed resize-y"
                                  />
                                </div>
                                <div>
                                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Variables disponibles</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {t.variables.map((v) => (
                                      <button
                                        key={v}
                                        type="button"
                                        onClick={() => {
                                          setEditForm({ ...editForm, cuerpo: editForm.cuerpo + `{{${v}}}` });
                                        }}
                                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-50 text-oro/70 border border-gray-200 hover:bg-amber-50 hover:text-oro transition-colors cursor-pointer"
                                        title={`Insertar {{${v}}}`}
                                      >
                                        {`{{${v}}}`}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                  <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>
                                    Cancelar
                                  </Button>
                                  <Button size="sm" onClick={() => saveTemplate(t.id)}>
                                    <Save className="w-3.5 h-3.5" /> Guardar
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
      </div>}
    </div>
  );
}
