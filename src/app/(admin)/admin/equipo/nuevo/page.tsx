"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTeamStore, type MemberRole } from "@/lib/stores/team-store";
import type { CaseArea } from "@/lib/pipelines";
import Button from "@/components/ui/button";
import { ArrowLeft, Save, CheckCircle2, Scale, GraduationCap, Upload, X as XIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ALL_AREAS: CaseArea[] = ["Disciplinario", "Penal Militar", "Familia", "Civil", "Consumidor", "Documentos"];
const COLORS = ["#3b82f6", "#a855f7", "#22c55e", "#ef4444", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6"];

export default function NuevoMiembroPage() {
  const router = useRouter();
  const { addMember } = useTeamStore();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<MemberRole>("abogado");
  const [uploading, setUploading] = useState(false);
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
    // Profesor
    especialidad_academica: "",
    bio: "",
    avatar_url: "",
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error subiendo imagen");
        return;
      }

      setForm((f) => ({ ...f, avatar_url: data.url }));
      toast.success("Foto subida");
    } catch {
      toast.error("Error subiendo imagen");
    } finally {
      setUploading(false);
    }
  };

  const canSave = role === "profesor"
    ? form.nombre.trim() && form.email.trim() && form.especialidad_academica.trim()
    : form.nombre.trim() && form.email.trim() && form.cedula.trim() && form.areas_habilitadas.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    addMember({
      ...form,
      role,
      estado: "activo",
      especialidad: role === "abogado" && form.areas_habilitadas.includes(form.especialidad)
        ? form.especialidad
        : form.areas_habilitadas[0] || "Disciplinario",
    });
    router.push("/admin/equipo");
  };

  const inputCls = "w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg placeholder-beige/20 focus:outline-none focus:border-oro/40";
  const labelCls = "text-beige/40 text-[10px] block mb-1";

  return (
    <div className="space-y-4 max-w-lg">
      <Link href="/admin/equipo" className="inline-flex items-center gap-1.5 text-beige/40 text-sm hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Equipo
      </Link>

      <h1 className="text-white text-xl font-bold">Nuevo miembro</h1>

      {/* Role selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setRole("abogado")}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
            role === "abogado"
              ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
              : "bg-white/5 border-white/10 text-beige/40 hover:text-white"
          }`}
        >
          <Scale className="w-4 h-4" /> Abogado
        </button>
        <button
          onClick={() => setRole("profesor")}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
            role === "profesor"
              ? "bg-purple-500/15 border-purple-500/30 text-purple-400"
              : "bg-white/5 border-white/10 text-beige/40 hover:text-white"
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Profesor
        </button>
      </div>

      <div className="space-y-4">
        {/* Basic info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder={role === "profesor" ? "Prof. Nombre Apellido" : "Dr. / Dra. Nombre Apellido"} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@legionjuridica.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="3176689..." className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Cédula {role === "abogado" ? "*" : ""}</label>
              <input type="text" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contraseña inicial</label>
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`${inputCls} font-mono`} />
            </div>
          </div>
        </div>

        {/* Abogado-specific fields */}
        {role === "abogado" && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <label className={labelCls}>Áreas habilitadas *</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
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
                  <label className={labelCls}>Especialidad principal</label>
                  <select value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value as CaseArea })}
                    className={`${inputCls} appearance-none`}>
                    {form.areas_habilitadas.map((area) => (
                      <option key={area} value={area} className="bg-jungle-dark">{area}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <label className={labelCls}>Max casos simultáneos</label>
              <input type="number" min={1} max={50} value={form.max_casos}
                onChange={(e) => setForm({ ...form, max_casos: parseInt(e.target.value) || 1 })} className={inputCls} />
            </div>
          </>
        )}

        {/* Profesor-specific fields */}
        {role === "profesor" && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <div>
              <label className={labelCls}>Especialidad académica *</label>
              <input type="text" value={form.especialidad_academica}
                onChange={(e) => setForm({ ...form, especialidad_academica: e.target.value })}
                placeholder="Ej: Derecho Penal Militar, Derecho de Familia..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Biografía / Perfil</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
                placeholder="Experiencia, títulos, publicaciones..."
                className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={labelCls}>Foto de perfil</label>
              {form.avatar_url ? (
                <div className="flex items-center gap-3 mt-1">
                  <img src={form.avatar_url} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-white/10" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, avatar_url: "" })}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <XIcon className="w-3 h-3" /> Quitar
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center gap-2 py-6 mt-1 border-2 border-dashed border-white/10 hover:border-oro/30 rounded-xl cursor-pointer transition-colors group ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-oro animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-beige/30 group-hover:text-oro transition-colors" />
                  )}
                  <span className="text-beige/40 text-xs group-hover:text-beige/60 transition-colors">
                    {uploading ? "Subiendo..." : "Click para subir foto (JPG, PNG, WebP)"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Color + notes */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div>
            <label className={labelCls}>Color del avatar</label>
            <div className="flex gap-2 mt-1">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-jungle-dark scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Notas</label>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2}
              placeholder="Observaciones..." className={`${inputCls} resize-none`} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={!canSave} className="w-full">
          <Save className="w-4 h-4" /> Crear {role === "profesor" ? "profesor" : "abogado"}
        </Button>
      </div>
    </div>
  );
}
