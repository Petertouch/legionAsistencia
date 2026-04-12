"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTeamStore } from "@/lib/stores/team-store";
import Button from "@/components/ui/button";
import { ArrowLeft, Save, Upload, X as XIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#a855f7", "#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#14b8a6", "#ec4899", "#f59e0b"];

export default function NuevoProfesorPage() {
  const router = useRouter();
  const { addMember } = useTeamStore();
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cedula: "",
    especialidad_academica: "",
    bio: "",
    avatar_url: "",
    fecha_ingreso: new Date().toISOString().split("T")[0],
    password: "",
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    notas: "",
  });

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB"); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error subiendo imagen"); return; }
      setForm((f) => ({ ...f, avatar_url: data.url }));
      toast.success("Foto subida");
    } catch { toast.error("Error subiendo imagen"); }
    finally { setUploading(false); }
  };

  const canSave = form.nombre.trim() && form.email.trim() && form.especialidad_academica.trim();

  const handleSave = () => {
    if (!canSave) return;
    addMember({
      ...form,
      role: "profesor",
      estado: "activo",
      areas_habilitadas: [],
      especialidad: "Disciplinario",
      max_casos: 0,
      comision_porcentaje: 0,
      vendedor_code: "",
      ciudad: "",
    });
    toast.success("Profesor creado");
    router.push("/admin/profesores");
  };

  const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg placeholder-beige/20 focus:outline-none focus:border-oro/40";
  const labelCls = "text-gray-400 text-[10px] block mb-1";

  return (
    <div className="space-y-4 max-w-lg">
      <Link href="/admin/profesores" className="inline-flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Profesores
      </Link>

      <h1 className="text-gray-900 text-xl font-bold">Nuevo profesor</h1>

      <div className="space-y-4">
        {/* Foto */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <label className={labelCls}>Foto de perfil</label>
          {form.avatar_url ? (
            <div className="flex items-center gap-4 mt-2">
              <img src={form.avatar_url} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-purple-500/30" />
              <div>
                <p className="text-gray-500 text-xs mb-2">Foto subida</p>
                <button type="button" onClick={() => setForm({ ...form, avatar_url: "" })}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-300 transition-colors">
                  <XIcon className="w-3 h-3" /> Quitar foto
                </button>
              </div>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center gap-2 py-8 mt-1 border-2 border-dashed border-gray-200 hover:border-purple-500/30 rounded-xl cursor-pointer transition-colors group ${uploading ? "pointer-events-none opacity-60" : ""}`}>
              {uploading ? (
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-purple-500/10 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
              )}
              <span className="text-gray-400 text-xs group-hover:text-gray-500 transition-colors">
                {uploading ? "Subiendo..." : "Click para subir foto (JPG, PNG, WebP · max 5MB)"}
              </span>
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          )}
        </div>

        {/* Info básica */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Prof. Nombre Apellido" className={inputCls} />
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
              <label className={labelCls}>Cédula</label>
              <input type="text" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contraseña inicial</label>
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`${inputCls} font-mono`} />
            </div>
          </div>
        </div>

        {/* Perfil académico */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div>
            <label className={labelCls}>Especialidad académica *</label>
            <input type="text" value={form.especialidad_academica}
              onChange={(e) => setForm({ ...form, especialidad_academica: e.target.value })}
              placeholder="Ej: Derecho Penal Militar, Derecho de Familia..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Biografía / Perfil</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4}
              placeholder="Experiencia profesional, títulos académicos, publicaciones, logros..."
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Color + notas */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div>
            <label className={labelCls}>Color del avatar (si no hay foto)</label>
            <div className="flex gap-2 mt-1">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-white scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Notas internas</label>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2}
              placeholder="Observaciones..." className={`${inputCls} resize-none`} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={!canSave} className="w-full">
          <Save className="w-4 h-4" /> Crear profesor
        </Button>
      </div>
    </div>
  );
}
