"use client";

import { useEffect, useState, useMemo } from "react";
// Uses API routes instead of direct Supabase client for security
import Link from "next/link";
import {
  ShieldCheck, Clock, CheckCircle, XCircle, AlertTriangle,
  Loader2, ScanFace, Camera, Eye, ChevronRight,
} from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "sonner";

type ApprovalStatus = "pendiente" | "aprobado" | "rechazado";

interface ContratoIdentidad {
  id: string;
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  plan: string;
  foto_data: string | null;
  cedula_frente_data: string | null;
  cedula_reverso_data: string | null;
  created_at: string;
  identidad_status: ApprovalStatus;
  identidad_notas: string | null;
}

export default function AprobacionIdentidadPage() {
  const [contratos, setContratos] = useState<ContratoIdentidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | ApprovalStatus>("pendiente");

  useEffect(() => { loadContratos(); }, []);

  async function loadContratos() {
    setLoading(true);
    const res = await fetch("/api/contratos/identidad");
    const data = res.ok ? await res.json() : [];

    setContratos((data || []).map((c: Record<string, unknown>) => ({
      ...c,
      identidad_status: (c.identidad_status as ApprovalStatus) || "pendiente",
      identidad_notas: (c.identidad_notas as string) || null,
    })) as ContratoIdentidad[]);
    setLoading(false);
  }

  async function quickApprove(id: string) {
    await fetch("/api/contratos/identidad", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, identidad_status: "aprobado" }),
    });
    setContratos((prev) => prev.map((c) => c.id === id ? { ...c, identidad_status: "aprobado" } : c));
    toast.success("Identidad aprobada");
  }

  async function quickReject(id: string) {
    await fetch("/api/contratos/identidad", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, identidad_status: "rechazado" }),
    });
    setContratos((prev) => prev.map((c) => c.id === id ? { ...c, identidad_status: "rechazado" } : c));
    toast.success("Identidad rechazada");
  }

  const stats = useMemo(() => ({
    total: contratos.length,
    pendientes: contratos.filter((c) => c.identidad_status === "pendiente").length,
    aprobados: contratos.filter((c) => c.identidad_status === "aprobado").length,
    rechazados: contratos.filter((c) => c.identidad_status === "rechazado").length,
    sinFotos: contratos.filter((c) => !c.foto_data).length,
  }), [contratos]);

  const filtered = filter === "todos"
    ? contratos
    : contratos.filter((c) => c.identidad_status === filter);

  const hasPhotos = (c: ContratoIdentidad) => !!c.foto_data;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-oro animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <ScanFace className="w-6 h-6 text-oro" />
            Aprobación de identidad
          </h1>
          <p className="text-gray-400 text-sm mt-1">Revisa y aprueba la identidad de cada cliente</p>
        </div>
        <Link href="/admin/validacion-identidad/probar">
          <Button size="sm" variant="ghost"><Camera className="w-4 h-4" /> Probar sistema</Button>
        </Link>
      </div>

      {/* Summary tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "pendiente" as const, label: "Pendientes", count: stats.pendientes, color: "text-yellow-600", bg: "bg-yellow-500/10 border-yellow-200" },
          { key: "aprobado" as const, label: "Aprobados", count: stats.aprobados, color: "text-green-600", bg: "bg-green-500/10 border-green-200" },
          { key: "rechazado" as const, label: "Rechazados", count: stats.rechazados, color: "text-red-600", bg: "bg-red-50 border-red-200" },
          { key: "todos" as const, label: "Todos", count: stats.total, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex-shrink-0 ${
              filter === tab.key
                ? `${tab.bg} ${tab.color} ring-1 ring-current/20`
                : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-200"
            }`}
          >
            {tab.label}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${filter === tab.key ? "bg-gray-100" : "bg-gray-50"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Pending alert */}
      {stats.pendientes > 0 && filter !== "pendiente" && (
        <button
          onClick={() => setFilter("pendiente")}
          className="w-full bg-yellow-500/10 border border-yellow-200 rounded-xl p-3 flex items-center gap-3 hover:bg-yellow-50 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <span className="text-yellow-300 text-sm font-medium">{stats.pendientes} {stats.pendientes === 1 ? "contrato requiere" : "contratos requieren"} aprobación de identidad</span>
          <ChevronRight className="w-4 h-4 text-yellow-600/50 ml-auto" />
        </button>
      )}

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <ScanFace className="w-10 h-10 text-beige/15 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay contratos {filter !== "todos" ? `con estado "${filter}"` : ""}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`bg-gray-50 border rounded-xl overflow-hidden transition-all ${
                c.identidad_status === "pendiente" ? "border-yellow-200" :
                c.identidad_status === "aprobado" ? "border-green-200" :
                "border-red-200"
              }`}
            >
              {/* Photos row */}
              <div className="flex gap-0.5 bg-black/30 p-2">
                {/* Selfie */}
                <div className="flex-1 relative">
                  {c.foto_data ? (
                    <img src={c.foto_data} alt="Selfie" className="w-full aspect-square object-cover rounded-lg" />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                      <Camera className="w-6 h-6 text-beige/15" />
                      <span className="text-beige/15 text-[9px] mt-1">Sin selfie</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/70 text-gray-900 text-[9px] px-1.5 py-0.5 rounded">Selfie</span>
                </div>

                {/* Cédula frente */}
                <div className="flex-1 relative">
                  {c.cedula_frente_data ? (
                    <img src={c.cedula_frente_data} alt="Cédula frente" className="w-full aspect-square object-contain rounded-lg bg-black/50" />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                      <Camera className="w-6 h-6 text-beige/15" />
                      <span className="text-beige/15 text-[9px] mt-1">Sin foto</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/70 text-gray-900 text-[9px] px-1.5 py-0.5 rounded">Cédula frente</span>
                </div>

                {/* Cédula reverso */}
                <div className="flex-1 relative">
                  {c.cedula_reverso_data ? (
                    <img src={c.cedula_reverso_data} alt="Cédula reverso" className="w-full aspect-square object-contain rounded-lg bg-black/50" />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                      <Camera className="w-6 h-6 text-beige/15" />
                      <span className="text-beige/15 text-[9px] mt-1">Sin foto</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/70 text-gray-900 text-[9px] px-1.5 py-0.5 rounded">Cédula reverso</span>
                </div>
              </div>

              {/* Info + actions */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-gray-900 font-bold text-sm">{c.nombre}</p>
                    <p className="text-gray-400 text-xs">CC {c.cedula} · {c.email}</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">{c.plan || "Sin plan"} · {new Date(c.created_at).toLocaleDateString("es-CO")}</p>
                  </div>
                  {/* Status badge */}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    c.identidad_status === "aprobado" ? "bg-green-50 text-green-600" :
                    c.identidad_status === "rechazado" ? "bg-red-100 text-red-600" :
                    "bg-yellow-50 text-yellow-600"
                  }`}>
                    {c.identidad_status === "aprobado" && <ShieldCheck className="w-3 h-3" />}
                    {c.identidad_status === "rechazado" && <XCircle className="w-3 h-3" />}
                    {c.identidad_status === "pendiente" && <Clock className="w-3 h-3" />}
                    {c.identidad_status}
                  </span>
                </div>

                {/* Actions */}
                {c.identidad_status === "pendiente" ? (
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/validacion-identidad/${c.id}`} className="flex-1">
                      <Button size="sm" variant="ghost" className="w-full"><Eye className="w-3.5 h-3.5" /> Revisar</Button>
                    </Link>
                    {hasPhotos(c) && (
                      <>
                        <button
                          onClick={() => quickApprove(c.id)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600/20 text-green-600 text-xs font-bold hover:bg-green-600/30 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                        </button>
                        <button
                          onClick={() => quickReject(c.id)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600/20 text-red-600 text-xs font-bold hover:bg-red-600/30 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rechazar
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/validacion-identidad/${c.id}`}>
                      <Button size="sm" variant="ghost"><Eye className="w-3.5 h-3.5" /> Ver detalle</Button>
                    </Link>
                    {c.identidad_status === "rechazado" && (
                      <button
                        onClick={() => quickApprove(c.id)}
                        className="text-green-600/60 hover:text-green-600 text-xs transition-colors"
                      >
                        Cambiar a aprobado
                      </button>
                    )}
                    {c.identidad_status === "aprobado" && (
                      <button
                        onClick={() => quickReject(c.id)}
                        className="text-red-600/40 hover:text-red-600 text-xs transition-colors"
                      >
                        Revocar
                      </button>
                    )}
                  </div>
                )}

                {/* Notes */}
                {c.identidad_notas && (
                  <p className="text-gray-300 text-[10px] mt-2 italic">Nota: {c.identidad_notas}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
