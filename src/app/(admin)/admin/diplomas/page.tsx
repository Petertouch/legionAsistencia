"use client";

import { useState, useEffect } from "react";
import { useDiplomaStore, renderDiplomaHtml } from "@/lib/stores/diploma-store";
import Button from "@/components/ui/button";
import { Award, RotateCcw, Save, Eye, Palette } from "lucide-react";
import { toast } from "sonner";

export default function DiplomasAdminPage() {
  const { template, updateTemplate, resetTemplate } = useDiplomaStore();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"editor" | "preview">("editor");

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const previewHtml = renderDiplomaHtml(template, {
    nombre: "Sargento Carlos Andrés Calvo",
    curso: "Finanzas Personales para Militares y Policías",
    fecha: new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
    certificateId: "CERT-DEMO-2026",
  });

  const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg placeholder-beige/20 focus:outline-none focus:border-oro/40";
  const labelCls = "text-gray-400 text-[10px] uppercase tracking-wider mb-1 block";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-lg font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-oro" /> Diplomas
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">Personaliza el diploma que reciben los estudiantes al completar un curso</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => { resetTemplate(); toast.success("Plantilla reseteada"); }}>
          <RotateCcw className="w-3.5 h-3.5" /> Resetear
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
        <button onClick={() => setTab("editor")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "editor" ? "bg-amber-100 text-oro border border-oro/30" : "text-gray-500 hover:text-gray-900 border border-transparent"
          }`}>
          <Palette className="w-4 h-4" /> Editor
        </button>
        <button onClick={() => setTab("preview")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "preview" ? "bg-amber-100 text-oro border border-oro/30" : "text-gray-500 hover:text-gray-900 border border-transparent"
          }`}>
          <Eye className="w-4 h-4" /> Vista previa
        </button>
      </div>

      {/* Preview */}
      {tab === "preview" && (
        <div className="bg-gray-900 rounded-xl p-6 overflow-auto">
          <div className="mx-auto" style={{ width: "800px", transform: "scale(0.85)", transformOrigin: "top center" }}>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}

      {/* Editor */}
      {tab === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Form */}
          <div className="space-y-4">
            {/* Textos */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 className="text-gray-900 text-sm font-bold mb-2">Textos</h3>
              <div>
                <label className={labelCls}>Título principal</label>
                <input type="text" value={template.titleText} onChange={(e) => updateTemplate({ titleText: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Subtítulo (arriba del título)</label>
                <input type="text" value={template.subtitleText} onChange={(e) => updateTemplate({ subtitleText: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Texto del cuerpo</label>
                <input type="text" value={template.bodyText} onChange={(e) => updateTemplate({ bodyText: e.target.value })} className={inputCls} />
              </div>
            </div>

            {/* Firmas */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 className="text-gray-900 text-sm font-bold mb-2">Firmas</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Firma 1 — Nombre</label>
                  <input type="text" value={template.signatureName} onChange={(e) => updateTemplate({ signatureName: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Firma 1 — Cargo</label>
                  <input type="text" value={template.signatureTitle} onChange={(e) => updateTemplate({ signatureTitle: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Firma 2 — Nombre</label>
                  <input type="text" value={template.signatureName2} onChange={(e) => updateTemplate({ signatureName2: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Firma 2 — Cargo</label>
                  <input type="text" value={template.signatureTitle2} onChange={(e) => updateTemplate({ signatureTitle2: e.target.value })} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Colores y opciones */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 className="text-gray-900 text-sm font-bold mb-2">Diseño</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Fondo</label>
                  <input type="color" value={template.bgColor} onChange={(e) => updateTemplate({ bgColor: e.target.value })} className="w-full h-9 rounded-lg cursor-pointer bg-transparent border border-gray-200" />
                </div>
                <div>
                  <label className={labelCls}>Borde</label>
                  <input type="color" value={template.borderColor} onChange={(e) => updateTemplate({ borderColor: e.target.value })} className="w-full h-9 rounded-lg cursor-pointer bg-transparent border border-gray-200" />
                </div>
                <div>
                  <label className={labelCls}>Acento</label>
                  <input type="color" value={template.accentColor} onChange={(e) => updateTemplate({ accentColor: e.target.value })} className="w-full h-9 rounded-lg cursor-pointer bg-transparent border border-gray-200" />
                </div>
              </div>
              <div>
                <label className={labelCls}>URL del logo</label>
                <input type="text" value={template.logoUrl} onChange={(e) => updateTemplate({ logoUrl: e.target.value })} className={inputCls} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={template.showBorder} onChange={(e) => updateTemplate({ showBorder: e.target.checked })} className="accent-oro" />
                  <span className="text-gray-500 text-xs">Mostrar borde</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={template.showLogo} onChange={(e) => updateTemplate({ showLogo: e.target.checked })} className="accent-oro" />
                  <span className="text-gray-500 text-xs">Mostrar logo</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Live preview */}
          <div className="bg-gray-900 rounded-xl p-4 overflow-auto">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-3 text-center">Vista previa en vivo</p>
            <div style={{ transform: "scale(0.48)", transformOrigin: "top center", height: "280px" }}>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
