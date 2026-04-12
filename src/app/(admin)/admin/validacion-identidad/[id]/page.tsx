"use client";

import { use, useState, useEffect } from "react";
// Uses API routes instead of direct Supabase client for security
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, XCircle, Clock, Camera, CreditCard,
  CheckCircle, AlertTriangle, Loader2, ScanFace, ZoomIn, User, FileText,
} from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "sonner";

interface ContratoDetalle {
  id: string;
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  plan: string;
  ciudad: string;
  fuerza: string;
  grado: string;
  foto_data: string | null;
  cedula_frente_data: string | null;
  cedula_reverso_data: string | null;
  firma_data: string | null;
  created_at: string;
  identidad_status: string;
  identidad_notas: string | null;
}

export default function AprobacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contrato, setContrato] = useState<ContratoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadContrato(); }, [id]);

  async function loadContrato() {
    const res = await fetch(`/api/contratos/identidad?id=${id}`);
    if (res.ok) {
      const data = await res.json();
      setContrato({ ...data, identidad_status: data.identidad_status || "pendiente" } as ContratoDetalle);
      setNotas(data.identidad_notas || "");
    }
    setLoading(false);
  }

  async function updateStatus(status: "aprobado" | "rechazado" | "pendiente") {
    if (!contrato) return;
    setSaving(true);
    await fetch("/api/contratos/identidad", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contrato.id, identidad_status: status, identidad_notas: notas || null }),
    });
    setContrato({ ...contrato, identidad_status: status, identidad_notas: notas });
    setSaving(false);
    const messages = { aprobado: "Identidad aprobada", rechazado: "Identidad rechazada", pendiente: "Marcado como pendiente" };
    toast.success(messages[status]);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-oro animate-spin" /></div>;
  if (!contrato) return <div className="text-center py-20"><p className="text-gray-400">Contrato no encontrado</p><Link href="/admin/validacion-identidad" className="text-oro text-sm hover:underline">Volver</Link></div>;

  const status = contrato.identidad_status;
  const statusConfig = {
    aprobado: { color: "text-green-600", bg: "bg-green-50", icon: ShieldCheck, label: "Aprobado" },
    rechazado: { color: "text-red-600", bg: "bg-red-100", icon: XCircle, label: "Rechazado" },
    pendiente: { color: "text-yellow-600", bg: "bg-yellow-50", icon: Clock, label: "Pendiente de aprobación" },
  }[status] || { color: "text-yellow-600", bg: "bg-yellow-50", icon: Clock, label: "Pendiente" };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Zoom modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} alt="Zoom" className="max-w-full max-h-full object-contain rounded-lg" />
          <button className="absolute top-4 right-4 text-gray-900/60 hover:text-gray-900 text-sm">Cerrar</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/validacion-identidad" className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-gray-900 text-xl font-bold">Revisar identidad</h1>
          <p className="text-gray-400 text-sm">{contrato.nombre} · CC {contrato.cedula}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.color}`}>
          <statusConfig.icon className="w-3.5 h-3.5" />
          {statusConfig.label}
        </span>
      </div>

      {/* Client info card */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-gray-400" />
          <h2 className="text-gray-900 text-sm font-bold">Datos del cliente</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-gray-400 text-xs">Nombre</p><p className="text-gray-900 font-medium">{contrato.nombre}</p></div>
          <div><p className="text-gray-400 text-xs">Cédula</p><p className="text-gray-900 font-mono">{contrato.cedula}</p></div>
          <div><p className="text-gray-400 text-xs">Email</p><p className="text-gray-900">{contrato.email}</p></div>
          <div><p className="text-gray-400 text-xs">Teléfono</p><p className="text-gray-900">{contrato.telefono}</p></div>
          <div><p className="text-gray-400 text-xs">Plan</p><p className="text-gray-900">{contrato.plan || "—"}</p></div>
          <div><p className="text-gray-400 text-xs">Ciudad</p><p className="text-gray-900">{contrato.ciudad || "—"}</p></div>
          <div><p className="text-gray-400 text-xs">Fuerza</p><p className="text-gray-900">{contrato.fuerza || "—"}</p></div>
          <div><p className="text-gray-400 text-xs">Grado</p><p className="text-gray-900">{contrato.grado || "—"}</p></div>
        </div>
      </div>

      {/* ══ PHOTOS — Main review area ══ */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ScanFace className="w-4 h-4 text-oro" />
          <h2 className="text-gray-900 text-sm font-bold">Verificación de identidad</h2>
          <span className="text-gray-300 text-xs ml-auto">Click en cualquier foto para ampliar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Selfie */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-gray-900 text-xs font-bold">Selfie del cliente</span>
            </div>
            {contrato.foto_data ? (
              <button onClick={() => setZoomedImage(contrato.foto_data)} className="relative w-full group">
                <img src={contrato.foto_data} alt="Selfie" className="w-full aspect-[3/4] object-cover rounded-xl border border-gray-200 group-hover:border-oro/30 transition-colors" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ) : (
              <div className="w-full aspect-[3/4] rounded-xl border border-dashed border-red-500/30 bg-red-50 flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600/50" />
                <span className="text-red-600/50 text-xs">Sin selfie</span>
              </div>
            )}
          </div>

          {/* Cédula frente */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-gray-900 text-xs font-bold">Cédula — Frente</span>
            </div>
            {contrato.cedula_frente_data ? (
              <button onClick={() => setZoomedImage(contrato.cedula_frente_data)} className="relative w-full group">
                <img src={contrato.cedula_frente_data} alt="Cédula frente" className="w-full aspect-[3/4] object-contain bg-black/30 rounded-xl border border-gray-200 group-hover:border-oro/30 transition-colors" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ) : (
              <div className="w-full aspect-[3/4] rounded-xl border border-dashed border-yellow-500/30 bg-yellow-500/5 flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6 text-yellow-600/50" />
                <span className="text-yellow-600/50 text-xs">Sin foto de cédula frente</span>
              </div>
            )}
          </div>

          {/* Cédula reverso */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-900 text-xs font-bold">Cédula — Reverso</span>
            </div>
            {contrato.cedula_reverso_data ? (
              <button onClick={() => setZoomedImage(contrato.cedula_reverso_data)} className="relative w-full group">
                <img src={contrato.cedula_reverso_data} alt="Cédula reverso" className="w-full aspect-[3/4] object-contain bg-black/30 rounded-xl border border-gray-200 group-hover:border-oro/30 transition-colors" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ) : (
              <div className="w-full aspect-[3/4] rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2">
                <CreditCard className="w-6 h-6 text-beige/15" />
                <span className="text-gray-300 text-xs">Sin foto reverso</span>
              </div>
            )}
          </div>
        </div>

        {/* Checklist visual */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-200">
          {[
            { label: "Selfie clara", ok: !!contrato.foto_data },
            { label: "Cédula frente", ok: !!contrato.cedula_frente_data },
            { label: "Cédula reverso", ok: !!contrato.cedula_reverso_data },
            { label: "Cara visible", ok: !!contrato.foto_data },
          ].map((check) => (
            <div key={check.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${check.ok ? "bg-green-500/5" : "bg-red-50"}`}>
              {check.ok ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600/50" />}
              <span className={`text-xs ${check.ok ? "text-green-600" : "text-red-600/50"}`}>{check.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Firma */}
      {contrato.firma_data && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-gray-400" />
            <h2 className="text-gray-900 text-sm font-bold">Firma del contrato</h2>
          </div>
          <div className="bg-white rounded-lg p-2 max-w-xs">
            <img src={contrato.firma_data} alt="Firma" className="w-full" />
          </div>
        </div>
      )}

      {/* ══ APPROVAL SECTION ══ */}
      <div className={`border rounded-xl p-5 space-y-4 ${
        status === "aprobado" ? "bg-green-500/5 border-green-200" :
        status === "rechazado" ? "bg-red-50 border-red-200" :
        "bg-yellow-500/5 border-yellow-200"
      }`}>
        <h2 className="text-gray-900 text-sm font-bold">Decisión</h2>

        <div>
          <label className="text-gray-500 text-xs font-medium mb-1.5 block">Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40 resize-none"
            placeholder="Ej: Foto borrosa, pedir nueva selfie..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => updateStatus("aprobado")} disabled={saving} className="bg-green-600 hover:bg-green-700 border-green-500">
            <ShieldCheck className="w-4 h-4" /> Aprobar identidad
          </Button>
          <Button onClick={() => updateStatus("rechazado")} disabled={saving} className="bg-red-600 hover:bg-red-700 border-red-500">
            <XCircle className="w-4 h-4" /> Rechazar
          </Button>
          {status !== "pendiente" && (
            <Button variant="ghost" onClick={() => updateStatus("pendiente")} disabled={saving}>
              <Clock className="w-4 h-4" /> Volver a pendiente
            </Button>
          )}
        </div>

        {status === "aprobado" && (
          <p className="text-green-600/60 text-xs flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Identidad verificada y aprobada</p>
        )}
        {status === "rechazado" && (
          <p className="text-red-600/60 text-xs flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Identidad rechazada — el cliente debe enviar nuevas fotos</p>
        )}
      </div>
    </div>
  );
}
