"use client";

import { Plus, Trash2, X } from "lucide-react";

export interface PlanConfig {
  nombre: string;
  precio: string;
  precio_alianza?: string;
  caracteristicas: string[];
}

interface PlanEditorProps {
  planes: PlanConfig[];
  onChange: (planes: PlanConfig[]) => void;
}

export default function PlanEditor({ planes, onChange }: PlanEditorProps) {
  const updatePlan = (index: number, field: keyof PlanConfig, value: string | string[]) => {
    const updated = [...planes];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addFeature = (planIndex: number) => {
    const updated = [...planes];
    updated[planIndex] = {
      ...updated[planIndex],
      caracteristicas: [...updated[planIndex].caracteristicas, ""],
    };
    onChange(updated);
  };

  const updateFeature = (planIndex: number, featIndex: number, value: string) => {
    const updated = [...planes];
    const feats = [...updated[planIndex].caracteristicas];
    feats[featIndex] = value;
    updated[planIndex] = { ...updated[planIndex], caracteristicas: feats };
    onChange(updated);
  };

  const removeFeature = (planIndex: number, featIndex: number) => {
    const updated = [...planes];
    updated[planIndex] = {
      ...updated[planIndex],
      caracteristicas: updated[planIndex].caracteristicas.filter((_, i) => i !== featIndex),
    };
    onChange(updated);
  };

  const addPlan = () => {
    onChange([...planes, { nombre: "Nuevo Plan", precio: "0", precio_alianza: "", caracteristicas: [] }]);
  };

  const removePlan = (index: number) => {
    onChange(planes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900 font-bold text-sm">Planes</h3>
        <span className="text-gray-400 text-xs">{planes.length} planes</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {planes.map((plan, pi) => (
          <div key={pi} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={plan.nombre}
                onChange={(e) => updatePlan(pi, "nombre", e.target.value)}
                className="bg-transparent text-gray-900 font-bold text-sm focus:outline-none border-b border-transparent focus:border-oro/50 w-full"
              />
              <button
                type="button"
                onClick={() => removePlan(pi)}
                className="p-1 text-gray-300 hover:text-red-600 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-sm">$</span>
              <input
                type="text"
                value={plan.precio}
                onChange={(e) => updatePlan(pi, "precio", e.target.value)}
                className="bg-gray-50 text-oro font-bold text-lg px-2 py-1 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none w-full"
              />
              <span className="text-gray-500 text-xs">/mes</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-[10px]">Alianza $</span>
              <input
                type="text"
                value={plan.precio_alianza || ""}
                onChange={(e) => updatePlan(pi, "precio_alianza", e.target.value)}
                placeholder="Vacío = sin descuento"
                className="bg-gray-50 text-green-600 font-bold text-sm px-2 py-1 rounded-lg border border-gray-200 focus:border-green-500/50 focus:outline-none w-full placeholder-gray-300"
              />
              <span className="text-gray-500 text-[10px]">/mes</span>
            </div>

            <div className="space-y-1.5">
              {plan.caracteristicas.map((feat, fi) => (
                <div key={fi} className="flex items-center gap-1.5 group">
                  <span className="text-green-600 text-xs flex-shrink-0">✓</span>
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => updateFeature(pi, fi, e.target.value)}
                    className="flex-1 bg-transparent text-gray-700 text-xs focus:outline-none border-b border-transparent focus:border-gray-300 placeholder-gray-300"
                    placeholder="Característica..."
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(pi, fi)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-600 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addFeature(pi)}
                className="text-gray-400 hover:text-oro text-[10px] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addPlan}
        className="border-2 border-dashed border-gray-200 hover:border-oro/40 rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-gray-500 hover:text-oro text-xs font-medium transition-colors"
      >
        <Plus className="w-4 h-4" /> Agregar plan
      </button>
    </div>
  );
}
