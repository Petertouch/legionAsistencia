"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTeamStore } from "@/lib/stores/team-store";
import type { CaseArea } from "@/lib/pipelines";
import Button from "@/components/ui/button";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";

const ALL_AREAS: CaseArea[] = ["Disciplinario", "Penal Militar", "Familia", "Civil", "Consumidor", "Documentos"];
const COLORS = ["#3b82f6", "#a855f7", "#22c55e", "#ef4444", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6"];

export default function NuevoAbogadoPage() {
  const router = useRouter();
  const { addAbogado } = useTeamStore();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cedula: "",
    areas_habilitadas: [] as CaseArea[],
    especialidad: "Disciplinario" as CaseArea,
    fecha_ingreso: new Date().toISOString().split("T")[0],
    password: "legion2026",
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    notas: "",
    max_casos: 10,
  });

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const toggleArea = (area: CaseArea) => {
    setForm((f) => ({
      ...f,
      areas_habilitadas: f.areas_habilitadas.includes(area)
        ? f.areas_habilitadas.filter((a) => a !== area)
        : [...f.areas_habilitadas, area],
    }));
  };

  const canSave = form.nombre.trim() && form.email.trim() && form.cedula.trim() && form.areas_habilitadas.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    addAbogado({
      ...form,
      estado: "activo",
      especialidad: form.areas_habilitadas.includes(form.especialidad) ? form.especialidad : form.areas_habilitadas[0],
    });
    router.push("/admin/equipo");
  };

  return (
    <div className="space-y-4 max-w-lg">
      <Link href="/admin/equipo" className="inline-flex items-center gap-1.5 text-beige/40 text-sm hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Equipo
      </Link>

      <h1 className="text-white text-xl font-bold">Nuevo abogado</h1>

      <div className="space-y-4">
        {/* Basic info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-beige/40 text-[10px] block mb-1">Nombre completo *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Dr. / Dra. Nombre Apellido"
              className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg placeholder-beige/20 focus:outline-none focus:border-oro/40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-beige/40 text-[10px] block mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@legionjuridica.com"
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg placeholder-beige/20 focus:outline-none focus:border-oro/40" />
            </div>
            <div>
              <label className="text-beige/40 text-[10px] block mb-1">Teléfono</label>
              <input type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="3176689..."
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg placeholder-beige/20 focus:outline-none focus:border-oro/40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-beige/40 text-[10px] block mb-1">Cédula *</label>
              <input type="text" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg placeholder-beige/20 focus:outline-none focus:border-oro/40" />
            </div>
            <div>
              <label className="text-beige/40 text-[10px] block mb-1">Max casos</label>
              <input type="number" min={1} max={50} value={form.max_casos} onChange={(e) => setForm({ ...form, max_casos: parseInt(e.target.value) || 1 })}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40" />
            </div>
          </div>
          <div>
            <label className="text-beige/40 text-[10px] block mb-1">Contraseña inicial</label>
            <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40 font-mono" />
          </div>
        </div>

        {/* Areas */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <label className="text-beige/40 text-[10px] block mb-2">Áreas habilitadas *</label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_AREAS.map((area) => {
              const enabled = form.areas_habilitadas.includes(area);
              return (
                <button key={area} onClick={() => toggleArea(area)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs text-left transition-all ${
                    enabled ? "bg-oro/10 border-oro/30 text-oro" : "bg-white/3 border-white/5 text-beige/25 hover:bg-white/5"
                  }`}>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    enabled ? "bg-oro/30 border-oro/50" : "border-white/10"
                  }`}>
                    {enabled && <CheckCircle2 className="w-2.5 h-2.5" />}
                  </div>
                  {area}
                </button>
              );
            })}
          </div>
          {form.areas_habilitadas.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <label className="text-beige/40 text-[10px] block mb-1">Especialidad principal</label>
              <select value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value as CaseArea })}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
                {form.areas_habilitadas.map((area) => (
                  <option key={area} value={area} className="bg-jungle-dark">{area}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Color + notes */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-beige/40 text-[10px] block mb-2">Color del avatar</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-jungle-dark scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-beige/40 text-[10px] block mb-1">Notas</label>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} placeholder="Experiencia, observaciones..."
              className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg placeholder-beige/20 focus:outline-none focus:border-oro/40 resize-none" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={!canSave} className="w-full">
          <Save className="w-4 h-4" /> Crear abogado
        </Button>
      </div>
    </div>
  );
}
