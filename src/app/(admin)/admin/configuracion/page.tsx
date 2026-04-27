"use client";

import { useState, useEffect } from "react";
import {
  PIPELINES, AREAS, type CaseArea, type PipelineStage, type ChecklistItem, type Pipeline,
} from "@/lib/pipelines";
import PlanEditor, { type PlanConfig } from "@/components/contract/plan-editor";
import Button from "@/components/ui/button";
import {
  Settings, ChevronDown, ChevronUp, Plus, Trash2, GripVertical,
  Save, RotateCcw, AlertTriangle, X, Scale, CreditCard,
} from "lucide-react";
import { toast } from "sonner";

const STAGE_COLORS = [
  "bg-blue-500", "bg-indigo-500", "bg-cyan-500", "bg-yellow-500", "bg-green-500",
  "bg-orange-500", "bg-red-500", "bg-purple-500", "bg-pink-500", "bg-gray-500",
];

const inputCls = "w-full bg-white border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40";

type ConfigTab = "pipelines" | "planes";

const DEFAULT_PLANES: PlanConfig[] = [
  { nombre: "Base", precio: "50.000", caracteristicas: ["Asesoría jurídica ilimitada", "1 consulta mensual"] },
  { nombre: "Plus", precio: "66.000", caracteristicas: ["Todo lo del Plan Base", "2 revisiones de documentos/mes", "Prioridad en respuesta"] },
  { nombre: "Elite", precio: "80.000", caracteristicas: ["Todo lo del Plan Plus", "Documentos ilimitados", "Abogado dedicado", "Atención prioritaria 24/7"] },
];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<ConfigTab>("pipelines");

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-oro" /> Configuración
        </h1>
        <p className="text-gray-500 text-xs mt-1">Administra pipelines, planes y configuración general</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
        <button
          onClick={() => setTab("pipelines")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "pipelines" ? "bg-white text-oro shadow-sm" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Scale className="w-4 h-4" /> Pipelines legales
        </button>
        <button
          onClick={() => setTab("planes")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "planes" ? "bg-white text-oro shadow-sm" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <CreditCard className="w-4 h-4" /> Planes y precios
        </button>
      </div>

      {tab === "pipelines" && <PipelinesTab />}
      {tab === "planes" && <PlanesTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Planes y precios
// ═══════════════════════════════════════════════════════════════════════════
function PlanesTab() {
  const [planes, setPlanes] = useState<PlanConfig[]>(DEFAULT_PLANES);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/config/planes")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlanes(data as PlanConfig[]);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/config/planes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planes }),
      });
      if (res.ok) {
        toast.success("Planes guardados");
        setHasChanges(false);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Error al guardar");
      }
    } catch { toast.error("Error de conexión"); }
    finally { setSaving(false); }
  };

  const handleReset = () => {
    if (!confirm("¿Restaurar planes a los valores por defecto?")) return;
    setPlanes(DEFAULT_PLANES);
    setHasChanges(true);
    toast.success("Planes restaurados");
  };

  if (!loaded) {
    return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-50 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">Define los planes de suscripción, precios y características. Estos se muestran en la landing y en la ficha de vinculación.</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasChanges && (
            <span className="text-amber-600 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Sin guardar
            </span>
          )}
          <button onClick={handleReset} className="flex items-center gap-1 text-gray-400 hover:text-gray-700 text-xs transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
          </button>
          <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Plan editor */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <PlanEditor
          planes={planes}
          onChange={(updated) => { setPlanes(updated); setHasChanges(true); }}
        />
      </div>

      {/* Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="text-gray-900 font-bold text-sm mb-3">Vista previa</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {planes.map((plan, i) => (
            <div key={i} className={`rounded-xl p-4 border ${i === 1 ? "bg-oro/5 border-oro/30 ring-2 ring-oro/10" : "bg-white border-gray-200"}`}>
              {i === 1 && <p className="text-oro text-[10px] font-bold uppercase tracking-wider mb-1">Más popular</p>}
              <h4 className="text-gray-900 font-bold text-base">{plan.nombre}</h4>
              <div className="flex items-baseline gap-1 mt-1 mb-3">
                <span className="text-gray-900 text-2xl font-black">${plan.precio}</span>
                <span className="text-gray-500 text-xs">/mes</span>
              </div>
              {plan.precio_alianza && (
                <p className="text-green-600 text-xs font-medium mb-2">Alianza: ${plan.precio_alianza}/mes</p>
              )}
              <ul className="space-y-1.5">
                {plan.caracteristicas.map((feat, fi) => (
                  <li key={fi} className="text-gray-600 text-xs flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Pipelines legales
// ═══════════════════════════════════════════════════════════════════════════
function PipelinesTab() {
  const [pipelines, setPipelines] = useState<Record<CaseArea, Pipeline>>(() => structuredClone(PIPELINES));
  const [selectedArea, setSelectedArea] = useState<CaseArea>("Disciplinario");
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetch("/api/config?key=pipelines")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.value) {
          try {
            const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
            setPipelines((prev) => ({ ...prev, ...parsed }));
          } catch { /* use defaults */ }
        }
      })
      .catch(() => {});
  }, []);

  const pipeline = pipelines[selectedArea];
  const stages = pipeline.stages;

  const updateStage = (index: number, updates: Partial<PipelineStage>) => {
    setPipelines((prev) => {
      const next = structuredClone(prev);
      next[selectedArea].stages[index] = { ...next[selectedArea].stages[index], ...updates };
      return next;
    });
    setHasChanges(true);
  };

  const addStage = () => {
    const idx = stages.length;
    const key = selectedArea.slice(0, 2).toLowerCase();
    setPipelines((prev) => {
      const next = structuredClone(prev);
      const cerradoIdx = next[selectedArea].stages.findIndex((s) => s.name === "Cerrado");
      const newStage: PipelineStage = {
        name: "Nueva etapa",
        expectedDays: 5,
        color: STAGE_COLORS[Math.min(idx, STAGE_COLORS.length - 1)],
        checklist: [{ key: `${key}-new-${Date.now()}`, label: "Tarea pendiente", required: false }],
      };
      if (cerradoIdx >= 0) {
        next[selectedArea].stages.splice(cerradoIdx, 0, newStage);
      } else {
        next[selectedArea].stages.push(newStage);
      }
      return next;
    });
    setHasChanges(true);
  };

  const removeStage = (index: number) => {
    if (stages[index].name === "Cerrado") {
      toast.error("No puedes eliminar la etapa 'Cerrado'");
      return;
    }
    if (!confirm(`¿Eliminar la etapa "${stages[index].name}"?`)) return;
    setPipelines((prev) => {
      const next = structuredClone(prev);
      next[selectedArea].stages.splice(index, 1);
      return next;
    });
    setExpandedStage(null);
    setHasChanges(true);
  };

  const moveStage = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= stages.length) return;
    setPipelines((prev) => {
      const next = structuredClone(prev);
      const arr = next[selectedArea].stages;
      [arr[index], arr[targetIdx]] = [arr[targetIdx], arr[index]];
      return next;
    });
    setExpandedStage(targetIdx);
    setHasChanges(true);
  };

  const addChecklistItem = (stageIdx: number) => {
    const key = `${selectedArea.slice(0, 2).toLowerCase()}-${Date.now()}`;
    setPipelines((prev) => {
      const next = structuredClone(prev);
      next[selectedArea].stages[stageIdx].checklist.push({ key, label: "", required: false });
      return next;
    });
    setHasChanges(true);
  };

  const updateChecklistItem = (stageIdx: number, itemIdx: number, updates: Partial<ChecklistItem>) => {
    setPipelines((prev) => {
      const next = structuredClone(prev);
      next[selectedArea].stages[stageIdx].checklist[itemIdx] = {
        ...next[selectedArea].stages[stageIdx].checklist[itemIdx],
        ...updates,
      };
      return next;
    });
    setHasChanges(true);
  };

  const removeChecklistItem = (stageIdx: number, itemIdx: number) => {
    setPipelines((prev) => {
      const next = structuredClone(prev);
      next[selectedArea].stages[stageIdx].checklist.splice(itemIdx, 1);
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "pipelines", value: pipelines }),
      });
      if (res.ok) {
        toast.success("Pipelines guardados");
        setHasChanges(false);
      } else {
        toast.error("Error al guardar");
      }
    } catch { toast.error("Error de conexión"); }
    finally { setSaving(false); }
  };

  const handleReset = () => {
    if (!confirm("¿Restaurar todos los pipelines a los valores originales?")) return;
    setPipelines(structuredClone(PIPELINES));
    setHasChanges(true);
    toast.success("Pipelines restaurados a valores por defecto");
  };

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">Define las etapas y checklists de cada área legal</p>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-amber-600 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Sin guardar
            </span>
          )}
          <button onClick={handleReset} className="flex items-center gap-1 text-gray-400 hover:text-gray-700 text-xs transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
          </button>
          <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Area tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {AREAS.map((area) => (
          <button
            key={area}
            onClick={() => { setSelectedArea(area); setExpandedStage(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              selectedArea === area
                ? "bg-oro/10 text-oro border-oro/30"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            {area}
            <span className="text-[10px] ml-1 opacity-60">({pipelines[area].stages.length})</span>
          </button>
        ))}
      </div>

      {/* Pipeline summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 font-bold text-sm">Pipeline: {selectedArea}</h2>
          <span className="text-gray-400 text-xs">{stages.length} etapas</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap mb-4">
          {stages.map((stage, i) => (
            <div key={i} className="flex items-center gap-1">
              <button
                onClick={() => setExpandedStage(expandedStage === i ? null : i)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${
                  expandedStage === i
                    ? "bg-oro/10 text-oro border-oro/30 ring-2 ring-oro/20"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {stage.name}
                <span className="text-[8px] ml-1 opacity-50">{stage.expectedDays}d</span>
              </button>
              {i < stages.length - 1 && <span className="text-gray-300 text-[10px]">→</span>}
            </div>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={addStage}>
          <Plus className="w-3 h-3" /> Agregar etapa
        </Button>
      </div>

      {/* Stages editor */}
      <div className="space-y-2">
        {stages.map((stage, stageIdx) => {
          const isOpen = expandedStage === stageIdx;
          return (
            <div key={stageIdx} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${
              isOpen ? "border-oro/30" : "border-gray-200"
            }`}>
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => moveStage(stageIdx, "up")} disabled={stageIdx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 p-0.5">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => moveStage(stageIdx, "down")} disabled={stageIdx === stages.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 p-0.5">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className={`w-3 h-3 rounded-full ${stage.color} flex-shrink-0`} />
                <button
                  onClick={() => setExpandedStage(isOpen ? null : stageIdx)}
                  className="flex-1 text-left flex items-center gap-2"
                >
                  <span className="text-gray-900 font-medium text-sm">{stage.name}</span>
                  <span className="text-gray-400 text-[10px]">{stage.expectedDays} días · {stage.checklist.length} tareas</span>
                </button>
                <button onClick={() => removeStage(stageIdx)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>

              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-500 text-[10px] font-medium mb-1 block">Nombre de la etapa</label>
                      <input type="text" value={stage.name} onChange={(e) => updateStage(stageIdx, { name: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-gray-500 text-[10px] font-medium mb-1 block">Días esperados</label>
                      <input type="number" value={stage.expectedDays} onChange={(e) => updateStage(stageIdx, { expectedDays: parseInt(e.target.value) || 0 })} className={inputCls} min="0" />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-500 text-[10px] font-medium mb-1 block">Color</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {STAGE_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateStage(stageIdx, { color })}
                          className={`w-6 h-6 rounded-full ${color} transition-all ${
                            stage.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-110"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-500 text-[10px] font-medium">Checklist ({stage.checklist.length} tareas)</label>
                      <button onClick={() => addChecklistItem(stageIdx)} className="text-oro text-[10px] font-medium hover:text-amber-700 flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Agregar tarea
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {stage.checklist.map((item, itemIdx) => (
                        <div key={item.key} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <GripVertical className="w-3 h-3 text-gray-300 flex-shrink-0" />
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateChecklistItem(stageIdx, itemIdx, { label: e.target.value })}
                            placeholder="Descripción de la tarea..."
                            className="flex-1 bg-transparent text-gray-900 text-xs focus:outline-none placeholder-gray-400"
                          />
                          <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={item.required}
                              onChange={(e) => updateChecklistItem(stageIdx, itemIdx, { required: e.target.checked })}
                              className="rounded border-gray-300 text-oro focus:ring-oro/20 w-3 h-3"
                            />
                            Obligatoria
                          </label>
                          <button onClick={() => removeChecklistItem(stageIdx, itemIdx)} className="text-gray-300 hover:text-red-500 p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {stage.checklist.length === 0 && (
                        <p className="text-gray-400 text-xs text-center py-2">Sin tareas en esta etapa</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
