"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTeamStore, type MemberEstado } from "@/lib/stores/team-store";
import { MOCK_CASOS } from "@/lib/mock-data";
import type { CaseArea } from "@/lib/pipelines";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import {
  ArrowLeft, Shield, Mail, Phone, Hash, Calendar, Key, Eye, EyeOff, Save, Scale,
  Briefcase, Clock, AlertTriangle, CheckCircle2, FileText, Trash2, Palmtree,
  Power, PowerOff, BookOpen, GraduationCap, Upload, X as XIcon, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const ALL_AREAS: CaseArea[] = ["Disciplinario", "Penal Militar", "Familia", "Civil", "Consumidor", "Documentos"];

const AREA_COLORS: Record<string, string> = {
  Disciplinario: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300",
  "Penal Militar": "bg-blue-500/20 border-blue-500/30 text-blue-300",
  Familia: "bg-pink-500/20 border-pink-500/30 text-pink-300",
  Civil: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
  Consumidor: "bg-orange-500/20 border-orange-500/30 text-orange-300",
  Documentos: "bg-gray-500/20 border-gray-500/30 text-gray-300",
};

const ESTADO_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  activo: { label: "Activo", variant: "success" },
  inactivo: { label: "Inactivo", variant: "danger" },
  vacaciones: { label: "Vacaciones", variant: "warning" },
};

interface Props { params: Promise<{ id: string }>; }

export default function MemberDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { getAbogado, updateAbogado, toggleArea, changePassword, setEstado, deleteAbogado } = useTeamStore();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({ telefono: "", email: "", notas: "", max_casos: 0, especialidad_academica: "", bio: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const member = getAbogado(id);
  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Miembro no encontrado</p>
        <Link href="/admin/equipo" className="text-oro text-sm mt-2 inline-block hover:underline">← Volver</Link>
      </div>
    );
  }

  const isProfesor = member.role === "profesor";
  const backHref = isProfesor ? "/admin/profesores" : "/admin/equipo";
  const backLabel = isProfesor ? "Profesores" : "Equipo";

  // Abogado stats
  const casosActivos = !isProfesor ? MOCK_CASOS.filter((c) => c.abogado === member.nombre && c.etapa !== "Cerrado") : [];
  const casosCerrados = !isProfesor ? MOCK_CASOS.filter((c) => c.abogado === member.nombre && c.etapa === "Cerrado") : [];
  const casosUrgentes = casosActivos.filter((c) => c.prioridad === "urgente" || c.prioridad === "alta");
  const cargaPct = !isProfesor && member.max_casos > 0 ? Math.round((casosActivos.length / member.max_casos) * 100) : 0;
  const sobrecargado = !isProfesor && casosActivos.length > member.max_casos;
  const casosPorArea: Record<string, number> = {};
  casosActivos.forEach((c) => { casosPorArea[c.area] = (casosPorArea[c.area] || 0) + 1; });

  const est = ESTADO_CONFIG[member.estado];

  const handlePasswordChange = () => {
    if (!newPassword.trim() || newPassword.length < 8) return;
    changePassword(id, newPassword.trim());
    setNewPassword("");
    setPasswordChanged(true);
    setTimeout(() => setPasswordChanged(false), 3000);
  };

  const startEditing = () => {
    setEditForm({
      telefono: member.telefono, email: member.email, notas: member.notas,
      max_casos: member.max_casos, especialidad_academica: member.especialidad_academica || "", bio: member.bio || "",
    });
    setEditingInfo(true);
  };

  const saveEditing = () => {
    updateAbogado(id, editForm);
    setEditingInfo(false);
    toast.success("Información actualizada");
  };

  const handleDelete = () => {
    if (!isProfesor && casosActivos.length > 0) return;
    deleteAbogado(id);
    router.push(backHref);
  };

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
      updateAbogado(id, { avatar_url: data.url });
      toast.success("Foto actualizada");
    } catch { toast.error("Error subiendo imagen"); }
    finally { setUploading(false); }
  };

  const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40";

  return (
    <div className="space-y-4 max-w-2xl">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </Link>

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        {/* Avatar / Photo */}
        <div className="relative group flex-shrink-0">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-gray-900 font-bold text-xl overflow-hidden"
            style={{ backgroundColor: member.avatar_url ? "transparent" : member.color }}>
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.nombre} className="w-full h-full object-cover" />
            ) : (
              member.nombre.split(" ").pop()?.[0] || "?"
            )}
          </div>
          {isProfesor && (
            <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploading ? <Loader2 className="w-5 h-5 text-gray-900 animate-spin" /> : <Upload className="w-5 h-5 text-gray-900" />}
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-gray-900 text-xl font-bold">{member.nombre}</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
              isProfesor ? "text-purple-600 bg-purple-500/10 border-purple-500/20" : "text-blue-600 bg-blue-500/10 border-blue-200"
            }`}>
              {isProfesor ? "Profesor" : "Abogado"}
            </span>
            <button onClick={() => { const order: MemberEstado[] = ["activo", "inactivo", "vacaciones"]; setEstado(id, order[(order.indexOf(member.estado) + 1) % order.length]); }}
              className="transition-transform active:scale-90">
              <Badge size="sm" variant={est.variant}>{est.label}</Badge>
            </button>
          </div>
          {isProfesor ? (
            <p className="text-purple-600/60 text-sm">{member.especialidad_academica || "Sin especialidad"} • Desde {new Date(member.fecha_ingreso).toLocaleDateString("es-CO", { month: "short", year: "numeric" })}</p>
          ) : (
            <p className="text-gray-400 text-sm">{member.especialidad} • Desde {new Date(member.fecha_ingreso).toLocaleDateString("es-CO", { month: "short", year: "numeric" })}</p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════ */}
      {/* PROFESOR SECTIONS                     */}
      {/* ══════════════════════════════════════ */}
      {isProfesor && (
        <>
          {/* Bio */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" /> Perfil Académico
            </h3>
            {!editingInfo ? (
              <div>
                <div className="mb-3">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Especialidad</p>
                  <p className="text-gray-900 text-sm">{member.especialidad_academica || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Biografía</p>
                  <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">{member.bio || "Sin biografía"}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-[10px] block mb-1">Especialidad académica</label>
                  <input type="text" value={editForm.especialidad_academica}
                    onChange={(e) => setEditForm({ ...editForm, especialidad_academica: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px] block mb-1">Biografía</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={5} className={`${inputCls} resize-none`} />
                </div>
              </div>
            )}
          </div>

          {/* Cursos asociados (placeholder) */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" /> Cursos
            </h3>
            <p className="text-gray-400 text-xs">Los cursos asignados a este profesor aparecerán aquí.</p>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════ */}
      {/* ABOGADO SECTIONS                      */}
      {/* ══════════════════════════════════════ */}
      {!isProfesor && (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <Briefcase className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <p className="text-gray-900 text-lg font-bold">{casosActivos.length}</p>
              <p className="text-gray-400 text-[9px]">Activos</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <p className="text-gray-900 text-lg font-bold">{casosCerrados.length}</p>
              <p className="text-gray-400 text-[9px]">Cerrados</p>
            </div>
            <div className={`bg-gray-50 border rounded-xl p-3 text-center ${sobrecargado ? "border-red-500/30" : "border-gray-200"}`}>
              <AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${sobrecargado ? "text-red-600" : "text-gray-400"}`} />
              <p className={`text-lg font-bold ${sobrecargado ? "text-red-600" : "text-gray-900"}`}>{cargaPct}%</p>
              <p className="text-gray-400 text-[9px]">Carga</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <Clock className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <p className="text-gray-900 text-lg font-bold">{casosUrgentes.length}</p>
              <p className="text-gray-400 text-[9px]">Urgentes</p>
            </div>
          </div>

          {/* Workload bar */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-xs font-medium">Carga de trabajo</span>
              <span className={`text-xs font-bold ${sobrecargado ? "text-red-600" : cargaPct > 75 ? "text-yellow-600" : "text-green-600"}`}>
                {casosActivos.length} / {member.max_casos} casos
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${Math.min(cargaPct, 100)}%`,
                backgroundColor: sobrecargado ? "#ef4444" : cargaPct > 75 ? "#eab308" : "#22c55e",
              }} />
            </div>
          </div>

          {/* Cases by area */}
          {casosActivos.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" /> Casos activos por área
              </h3>
              <div className="space-y-2">
                {Object.entries(casosPorArea).map(([area, count]) => (
                  <div key={area} className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">{area}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-oro/60 rounded-full" style={{ width: `${(count / casosActivos.length) * 100}%` }} />
                      </div>
                      <span className="text-gray-900 text-xs font-medium w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                {casosActivos.map((c) => (
                  <Link key={c.id} href={`/admin/casos/${c.id}`} className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-gray-500 text-xs truncate flex-1">{c.titulo}</span>
                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      <Badge size="xs">{c.prioridad}</Badge>
                      <span className="text-gray-400 text-[9px]">{c.etapa}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Areas habilitadas */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-gray-400" /> Áreas del derecho habilitadas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ALL_AREAS.map((area) => {
                const enabled = member.areas_habilitadas.includes(area);
                const isEspecialidad = member.especialidad === area;
                return (
                  <button key={area} onClick={() => toggleArea(id, area)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${
                      enabled ? AREA_COLORS[area] : "bg-gray-50 border-gray-100 text-gray-300"
                    }`}>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${enabled ? "bg-gray-100 border-gray-300" : "border-gray-200"}`}>
                      {enabled && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span className="text-xs">{area}</span>
                    {isEspecialidad && enabled && <span className="text-[8px] bg-amber-100 text-oro px-1 py-px rounded-full ml-auto">ESP</span>}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <label className="text-gray-400 text-[10px] block mb-1.5">Especialidad principal</label>
              <select value={member.especialidad} onChange={(e) => updateAbogado(id, { especialidad: e.target.value as CaseArea })}
                className={`${inputCls} appearance-none`}>
                {member.areas_habilitadas.map((area) => (
                  <option key={area} value={area} className="bg-white">{area}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════ */}
      {/* SHARED SECTIONS                       */}
      {/* ══════════════════════════════════════ */}

      {/* Contact info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" /> Información
          </h3>
          {!editingInfo ? (
            <Button size="sm" variant="ghost" onClick={startEditing}>Editar</Button>
          ) : (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditingInfo(false)}>Cancelar</Button>
              <Button size="sm" onClick={saveEditing}><Save className="w-3 h-3" /> Guardar</Button>
            </div>
          )}
        </div>
        {!editingInfo ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span className="text-gray-500">{member.email}</span></div>
            <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-500">{member.telefono || "—"}</span></div>
            <div className="flex items-center gap-2 text-sm"><Hash className="w-4 h-4 text-gray-400" /><span className="text-gray-500">CC {member.cedula || "—"}</span></div>
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-500">Ingreso: {new Date(member.fecha_ingreso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span></div>
            {!isProfesor && (
              <div className="flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4 text-gray-400" /><span className="text-gray-500">Max casos: {member.max_casos}</span></div>
            )}
            {member.notas && <div className="mt-2 pt-2 border-t border-gray-100"><p className="text-gray-400 text-xs leading-relaxed">{member.notas}</p></div>}
          </div>
        ) : (
          <div className="space-y-3">
            <div><label className="text-gray-400 text-[10px] block mb-1">Email</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} /></div>
            <div><label className="text-gray-400 text-[10px] block mb-1">Teléfono</label><input type="tel" value={editForm.telefono} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} className={inputCls} /></div>
            {!isProfesor && (
              <div><label className="text-gray-400 text-[10px] block mb-1">Max casos simultáneos</label><input type="number" min={1} max={50} value={editForm.max_casos} onChange={(e) => setEditForm({ ...editForm, max_casos: parseInt(e.target.value) || 1 })} className={inputCls} /></div>
            )}
            <div><label className="text-gray-400 text-[10px] block mb-1">Notas</label><textarea value={editForm.notas} onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })} rows={2} className={`${inputCls} resize-none`} /></div>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2"><Key className="w-4 h-4 text-gray-400" /> Contraseña</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-gray-400 text-xs">Actual:</span>
          <span className="text-gray-500 text-sm font-mono">{showPassword ? member.password : "••••••••"}</span>
          <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-900 transition-colors">
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex gap-2">
          <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña (min 4)"
            className={`flex-1 ${inputCls} placeholder-beige/20`} />
          <Button size="sm" variant="secondary" onClick={handlePasswordChange} disabled={newPassword.length < 8}>Cambiar</Button>
        </div>
        {passwordChanged && <p className="text-green-600 text-xs mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Actualizada</p>}
      </div>

      {/* Estado */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="text-gray-900 font-bold text-sm mb-3">Estado</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["activo", "inactivo", "vacaciones"] as MemberEstado[]).map((e) => {
            const active = member.estado === e;
            const Icon = e === "activo" ? Power : e === "inactivo" ? PowerOff : Palmtree;
            return (
              <button key={e} onClick={() => setEstado(id, e)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                  active
                    ? e === "activo" ? "bg-green-50 border-green-500/30 text-green-600"
                    : e === "inactivo" ? "bg-red-100 border-red-500/30 text-red-600"
                    : "bg-yellow-50 border-yellow-500/30 text-yellow-600"
                    : "bg-gray-50 border-gray-100 text-gray-300 hover:bg-gray-50"
                }`}>
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium capitalize">{ESTADO_CONFIG[e].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 border border-red-500/15 rounded-xl p-4">
        <h3 className="text-red-600 font-bold text-sm mb-2">Zona de peligro</h3>
        {!isProfesor && casosActivos.length > 0 ? (
          <p className="text-gray-400 text-xs">No se puede eliminar — tiene {casosActivos.length} caso(s) activo(s).</p>
        ) : !confirmDelete ? (
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-3 h-3" /> Eliminar {isProfesor ? "profesor" : "abogado"}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-red-600 text-xs flex-1">¿Seguro? No se puede deshacer.</p>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>No</Button>
            <Button size="sm" variant="danger" onClick={handleDelete}>Sí, eliminar</Button>
          </div>
        )}
      </div>
    </div>
  );
}
