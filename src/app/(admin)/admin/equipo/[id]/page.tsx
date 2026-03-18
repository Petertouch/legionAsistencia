"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTeamStore, type AbogadoEstado } from "@/lib/stores/team-store";
import { MOCK_CASOS } from "@/lib/mock-data";
import type { CaseArea } from "@/lib/pipelines";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import {
  ArrowLeft,
  Shield,
  Mail,
  Phone,
  Hash,
  Calendar,
  Key,
  Eye,
  EyeOff,
  Save,
  Scale,
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Trash2,
  Palmtree,
  Power,
  PowerOff,
} from "lucide-react";

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

interface Props {
  params: Promise<{ id: string }>;
}

export default function AbogadoDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { getAbogado, updateAbogado, toggleArea, changePassword, setEstado, deleteAbogado } = useTeamStore();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({ telefono: "", email: "", notas: "", max_casos: 0 });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const abogado = getAbogado(id);
  if (!abogado) {
    return (
      <div className="text-center py-12">
        <p className="text-beige/40">Abogado no encontrado</p>
        <Link href="/admin/equipo" className="text-oro text-sm mt-2 inline-block hover:underline">← Volver al equipo</Link>
      </div>
    );
  }

  const casosActivos = MOCK_CASOS.filter((c) => c.abogado === abogado.nombre && c.etapa !== "Cerrado");
  const casosCerrados = MOCK_CASOS.filter((c) => c.abogado === abogado.nombre && c.etapa === "Cerrado");
  const casosUrgentes = casosActivos.filter((c) => c.prioridad === "urgente" || c.prioridad === "alta");
  const cargaPct = abogado.max_casos > 0 ? Math.round((casosActivos.length / abogado.max_casos) * 100) : 0;
  const sobrecargado = casosActivos.length > abogado.max_casos;

  // Cases by area
  const casosPorArea: Record<string, number> = {};
  casosActivos.forEach((c) => { casosPorArea[c.area] = (casosPorArea[c.area] || 0) + 1; });

  const est = ESTADO_CONFIG[abogado.estado];

  const handlePasswordChange = () => {
    if (!newPassword.trim() || newPassword.length < 4) return;
    changePassword(id, newPassword.trim());
    setNewPassword("");
    setPasswordChanged(true);
    setTimeout(() => setPasswordChanged(false), 3000);
  };

  const startEditing = () => {
    setEditForm({ telefono: abogado.telefono, email: abogado.email, notas: abogado.notas, max_casos: abogado.max_casos });
    setEditingInfo(true);
  };

  const saveEditing = () => {
    updateAbogado(id, editForm);
    setEditingInfo(false);
  };

  const handleDelete = () => {
    if (casosActivos.length > 0) return; // can't delete with active cases
    deleteAbogado(id);
    router.push("/admin/equipo");
  };

  const cycleEstado = () => {
    const order: AbogadoEstado[] = ["activo", "inactivo", "vacaciones"];
    const next = order[(order.indexOf(abogado.estado) + 1) % order.length];
    setEstado(id, next);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Back */}
      <Link href="/admin/equipo" className="inline-flex items-center gap-1.5 text-beige/40 text-sm hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Equipo
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
          style={{ backgroundColor: abogado.color }}>
          {abogado.nombre.split(" ").pop()?.[0] || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-white text-xl font-bold">{abogado.nombre}</h1>
            <button onClick={cycleEstado} className="transition-transform active:scale-90">
              <Badge size="sm" variant={est.variant}>{est.label}</Badge>
            </button>
            {abogado.estado === "vacaciones" && <Palmtree className="w-4 h-4 text-yellow-400" />}
          </div>
          <p className="text-beige/40 text-sm">{abogado.especialidad} • Desde {new Date(abogado.fecha_ingreso).toLocaleDateString("es-CO", { month: "short", year: "numeric" })}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <Briefcase className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <p className="text-white text-lg font-bold">{casosActivos.length}</p>
          <p className="text-beige/30 text-[9px]">Activos</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <p className="text-white text-lg font-bold">{casosCerrados.length}</p>
          <p className="text-beige/30 text-[9px]">Cerrados</p>
        </div>
        <div className={`bg-white/5 border rounded-xl p-3 text-center ${sobrecargado ? "border-red-500/30" : "border-white/10"}`}>
          <AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${sobrecargado ? "text-red-400" : "text-beige/30"}`} />
          <p className={`text-lg font-bold ${sobrecargado ? "text-red-400" : "text-white"}`}>{cargaPct}%</p>
          <p className="text-beige/30 text-[9px]">Carga</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <Clock className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <p className="text-white text-lg font-bold">{casosUrgentes.length}</p>
          <p className="text-beige/30 text-[9px]">Urgentes</p>
        </div>
      </div>

      {/* Workload bar */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-beige/50 text-xs font-medium">Carga de trabajo</span>
          <span className={`text-xs font-bold ${sobrecargado ? "text-red-400" : cargaPct > 75 ? "text-yellow-400" : "text-green-400"}`}>
            {casosActivos.length} / {abogado.max_casos} casos
          </span>
        </div>
        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${Math.min(cargaPct, 100)}%`,
            backgroundColor: sobrecargado ? "#ef4444" : cargaPct > 75 ? "#eab308" : "#22c55e",
          }} />
        </div>
        {sobrecargado && (
          <p className="text-red-400 text-[10px] mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Sobrecargado — considere reasignar casos
          </p>
        )}
      </div>

      {/* Cases by area */}
      {casosActivos.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-beige/40" /> Casos activos por área
          </h3>
          <div className="space-y-2">
            {Object.entries(casosPorArea).map(([area, count]) => (
              <div key={area} className="flex items-center justify-between">
                <span className="text-beige/50 text-xs">{area}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-oro/60 rounded-full" style={{ width: `${(count / casosActivos.length) * 100}%` }} />
                  </div>
                  <span className="text-white text-xs font-medium w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
            {casosActivos.map((c) => (
              <Link key={c.id} href={`/admin/casos/${c.id}`} className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors">
                <span className="text-beige/60 text-xs truncate flex-1">{c.titulo}</span>
                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                  <Badge size="xs">{c.prioridad}</Badge>
                  <span className="text-beige/30 text-[9px]">{c.etapa}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Areas habilitadas */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-beige/40" /> Áreas del derecho habilitadas
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {ALL_AREAS.map((area) => {
            const enabled = abogado.areas_habilitadas.includes(area);
            const isEspecialidad = abogado.especialidad === area;
            return (
              <button
                key={area}
                onClick={() => toggleArea(id, area)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${
                  enabled
                    ? AREA_COLORS[area]
                    : "bg-white/3 border-white/5 text-beige/25"
                }`}
              >
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                  enabled ? "bg-white/20 border-white/30" : "border-white/10"
                }`}>
                  {enabled && <CheckCircle2 className="w-3 h-3" />}
                </div>
                <span className="text-xs">{area}</span>
                {isEspecialidad && enabled && (
                  <span className="text-[8px] bg-oro/20 text-oro px-1 py-px rounded-full ml-auto">ESP</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-white/5">
          <label className="text-beige/40 text-[10px] block mb-1.5">Especialidad principal</label>
          <select
            value={abogado.especialidad}
            onChange={(e) => updateAbogado(id, { especialidad: e.target.value as CaseArea })}
            className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40 appearance-none"
          >
            {abogado.areas_habilitadas.map((area) => (
              <option key={area} value={area} className="bg-jungle-dark">{area}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-beige/40" /> Información
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
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-beige/30" />
              <span className="text-beige/60">{abogado.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-beige/30" />
              <span className="text-beige/60">{abogado.telefono}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Hash className="w-4 h-4 text-beige/30" />
              <span className="text-beige/60">CC {abogado.cedula}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-beige/30" />
              <span className="text-beige/60">Ingreso: {new Date(abogado.fecha_ingreso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-beige/30" />
              <span className="text-beige/60">Max casos: {abogado.max_casos}</span>
            </div>
            {abogado.notas && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-beige/40 text-xs leading-relaxed">{abogado.notas}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-beige/40 text-[10px] block mb-1">Email</label>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40" />
            </div>
            <div>
              <label className="text-beige/40 text-[10px] block mb-1">Teléfono</label>
              <input type="tel" value={editForm.telefono} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40" />
            </div>
            <div>
              <label className="text-beige/40 text-[10px] block mb-1">Max casos simultáneos</label>
              <input type="number" min={1} max={50} value={editForm.max_casos} onChange={(e) => setEditForm({ ...editForm, max_casos: parseInt(e.target.value) || 1 })}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40" />
            </div>
            <div>
              <label className="text-beige/40 text-[10px] block mb-1">Notas</label>
              <textarea value={editForm.notas} onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })} rows={2}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-oro/40 resize-none" />
            </div>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-beige/40" /> Contraseña
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-beige/40 text-xs">Actual:</span>
          <span className="text-beige/60 text-sm font-mono">{showPassword ? abogado.password : "••••••••"}</span>
          <button onClick={() => setShowPassword(!showPassword)} className="text-beige/30 hover:text-white transition-colors">
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña (min 4 caracteres)"
            className="flex-1 bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg placeholder-beige/20 focus:outline-none focus:border-oro/40"
          />
          <Button size="sm" variant="secondary" onClick={handlePasswordChange} disabled={newPassword.length < 4}>
            Cambiar
          </Button>
        </div>
        {passwordChanged && (
          <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Contraseña actualizada
          </p>
        )}
      </div>

      {/* Estado rápido */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-bold text-sm mb-3">Estado del abogado</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["activo", "inactivo", "vacaciones"] as AbogadoEstado[]).map((est) => {
            const active = abogado.estado === est;
            const cfg = ESTADO_CONFIG[est];
            const Icon = est === "activo" ? Power : est === "inactivo" ? PowerOff : Palmtree;
            return (
              <button
                key={est}
                onClick={() => setEstado(id, est)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                  active
                    ? est === "activo" ? "bg-green-500/15 border-green-500/30 text-green-400"
                    : est === "inactivo" ? "bg-red-500/15 border-red-500/30 text-red-400"
                    : "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                    : "bg-white/3 border-white/5 text-beige/25 hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium capitalize">{cfg.label}</span>
              </button>
            );
          })}
        </div>
        {abogado.estado === "inactivo" && casosActivos.length > 0 && (
          <p className="text-orange-400 text-[10px] mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Este abogado tiene {casosActivos.length} casos activos — reasigne antes de desactivar
          </p>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
        <h3 className="text-red-400 font-bold text-sm mb-2">Zona de peligro</h3>
        {casosActivos.length > 0 ? (
          <p className="text-beige/30 text-xs">No se puede eliminar porque tiene {casosActivos.length} caso(s) activo(s). Reasígnelos primero.</p>
        ) : !confirmDelete ? (
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-3 h-3" /> Eliminar abogado
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-red-400 text-xs flex-1">¿Seguro? Esta acción no se puede deshacer.</p>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>No</Button>
            <Button size="sm" variant="danger" onClick={handleDelete}>Sí, eliminar</Button>
          </div>
        )}
      </div>
    </div>
  );
}
