"use client";

import { useEffect, useState, useMemo } from "react";
import { useIdentityStore, type IdentityValidation, type ValidationStatus } from "@/lib/stores/identity-store";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ShieldCheck, ShieldAlert, ShieldQuestion, Clock, Settings, X, Save,
  Users, CheckCircle, XCircle, AlertTriangle, Loader2, ScanFace, Camera,
} from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "sonner";

const inputCls = "w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40";
const labelCls = "text-beige/60 text-xs font-medium mb-1.5 block";

export default function ValidacionIdentidadPage() {
  const { validations, setValidations, config, updateConfig } = useIdentityStore();
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<"todos" | ValidationStatus>("todos");
  const [processing, setProcessing] = useState(false);

  // Load contracts and generate validations for those without one
  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    setLoading(true);
    const supabase = createClient();
    const { data: contratos } = await supabase
      .from("contratos")
      .select("id, nombre, cedula, email, foto_data, cedula_frente_data, cedula_reverso_data, created_at")
      .order("created_at", { ascending: false });

    if (!contratos) { setLoading(false); return; }

    const existing = useIdentityStore.getState().validations;
    const newValidations: IdentityValidation[] = [];

    for (const c of contratos) {
      if (existing.find((v) => v.contrato_id === c.id)) continue;

      // Check for duplicate cédula
      const dupCedula = existing.some((v) => v.cedula === c.cedula && v.contrato_id !== c.id)
        || newValidations.some((v) => v.cedula === c.cedula);

      newValidations.push({
        id: `val-${c.id}`,
        contrato_id: c.id,
        suscriptor_id: null,
        nombre: c.nombre || "",
        cedula: c.cedula || "",
        email: c.email || "",
        facial_score: null,
        datos_match: null,
        calidad_selfie: null,
        calidad_cedula: null,
        duplicado_cedula: dupCedula,
        duplicado_cara: false,
        ocr_nombre: null,
        ocr_cedula: null,
        status: "pendiente",
        revisado_por: null,
        notas: "",
        created_at: c.created_at,
        updated_at: c.created_at,
      });
    }

    if (newValidations.length > 0) {
      setValidations([...existing, ...newValidations]);
    }
    setLoading(false);
  }

  // Run validation on all pending
  async function runAllValidations() {
    setProcessing(true);
    const supabase = createClient();
    const pending = validations.filter((v) => v.status === "pendiente" && v.facial_score === null);
    const { compareFaces, checkImageQuality, extractCedulaText, compareData } = await import("@/lib/identity-engine");

    let processed = 0;
    for (const val of pending) {
      // Get contract photos
      const { data: contrato } = await supabase
        .from("contratos")
        .select("foto_data, cedula_frente_data")
        .eq("id", val.contrato_id)
        .single();

      if (!contrato?.foto_data || !contrato?.cedula_frente_data) {
        useIdentityStore.getState().updateValidation(val.id, {
          calidad_selfie: false,
          calidad_cedula: false,
          status: "revision",
          notas: "Faltan fotos (selfie o cédula)",
        });
        processed++;
        continue;
      }

      // 1. Face comparison
      const faceResult = await compareFaces(contrato.foto_data, contrato.cedula_frente_data);

      // 2. Image quality
      const selfieQuality = faceResult.selfieDetected;
      const cedulaQuality = faceResult.cedulaDetected;

      // 3. OCR (try to extract data from cédula)
      let ocrNombre: string | null = null;
      let ocrCedula: string | null = null;
      let datosMatch: boolean | null = null;
      try {
        const ocrResult = await extractCedulaText(contrato.cedula_frente_data);
        ocrNombre = ocrResult.nombre;
        ocrCedula = ocrResult.cedula;
        const dataComp = compareData(ocrNombre, ocrCedula, val.nombre, val.cedula);
        datosMatch = dataComp.nombreMatch || dataComp.cedulaMatch;
      } catch {
        // OCR failed — not critical
      }

      // 4. Determine status
      let status: ValidationStatus = "pendiente";
      if (faceResult.score >= config.umbral_facial && selfieQuality && cedulaQuality && !val.duplicado_cedula) {
        status = config.auto_aprobar ? "verificado" : "revision";
      } else if (faceResult.score < 50 || !selfieQuality || !cedulaQuality) {
        status = "revision";
      }

      useIdentityStore.getState().updateValidation(val.id, {
        facial_score: faceResult.score,
        calidad_selfie: selfieQuality,
        calidad_cedula: cedulaQuality,
        datos_match: datosMatch,
        ocr_nombre: ocrNombre,
        ocr_cedula: ocrCedula,
        status,
      });

      processed++;
    }

    setProcessing(false);
    if (processed > 0) toast.success(`${processed} validaciones procesadas`);
    else toast.info("No hay validaciones pendientes");
  }

  // Stats
  const stats = useMemo(() => {
    const verificados = validations.filter((v) => v.status === "verificado").length;
    const pendientes = validations.filter((v) => v.status === "pendiente").length;
    const revision = validations.filter((v) => v.status === "revision").length;
    const rechazados = validations.filter((v) => v.status === "rechazado").length;
    return { verificados, pendientes, revision, rechazados, total: validations.length };
  }, [validations]);

  const filtered = filter === "todos" ? validations : validations.filter((v) => v.status === filter);

  const statusIcon = (s: ValidationStatus) => {
    switch (s) {
      case "verificado": return <ShieldCheck className="w-4 h-4 text-green-400" />;
      case "rechazado": return <XCircle className="w-4 h-4 text-red-400" />;
      case "revision": return <ShieldAlert className="w-4 h-4 text-yellow-400" />;
      default: return <Clock className="w-4 h-4 text-beige/40" />;
    }
  };

  const statusBadge = (s: ValidationStatus) => {
    const styles: Record<ValidationStatus, string> = {
      verificado: "bg-green-500/15 text-green-400",
      rechazado: "bg-red-500/15 text-red-400",
      revision: "bg-yellow-500/15 text-yellow-400",
      pendiente: "bg-white/10 text-beige/40",
    };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[s]}`}>{s}</span>;
  };

  const scoreColor = (score: number | null) => {
    if (score === null) return "text-beige/20";
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-oro animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <ScanFace className="w-6 h-6 text-oro" />
            Validación de identidad
          </h1>
          <p className="text-beige/40 text-sm mt-1">Verificación facial, datos y duplicados de clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-lg border transition-colors ${
              showSettings ? "bg-oro/10 border-oro/30 text-oro" : "bg-white/5 border-white/10 text-beige/40 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
          <Link href="/admin/validacion-identidad/probar">
            <Button size="sm" variant="ghost"><Camera className="w-4 h-4" /> Probar</Button>
          </Link>
          <Button size="sm" onClick={runAllValidations} disabled={processing}>
            {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : <><ScanFace className="w-4 h-4" /> Ejecutar validación</>}
          </Button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-white/5 border border-oro/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white text-sm font-bold flex items-center gap-2"><Settings className="w-4 h-4 text-oro" /> Configuración</h3>
            <button onClick={() => setShowSettings(false)} className="text-beige/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Umbral facial mínimo (%)</label>
              <input type="number" value={config.umbral_facial} onChange={(e) => updateConfig({ umbral_facial: parseInt(e.target.value) || 80 })} className={inputCls} min="50" max="100" />
              <p className="text-beige/20 text-[10px] mt-1">Debajo de {config.umbral_facial}% se marca como "Revisión"</p>
            </div>
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-2">
                  Auto-aprobar si pasa todo
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={config.auto_aprobar} onChange={(e) => updateConfig({ auto_aprobar: e.target.checked })} className="sr-only peer" />
                    <div className="w-8 h-4 bg-white/10 peer-checked:bg-green-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-beige/40 peer-checked:after:bg-green-400 after:rounded-full after:h-3 after:w-3 after:transition-all" />
                  </label>
                </span>
              </label>
              <p className="text-beige/20 text-[10px] mt-2">{config.auto_aprobar ? "Se aprueba automáticamente si score facial > umbral y no hay duplicados" : "Siempre requiere revisión manual del admin"}</p>
            </div>
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-2">
                  Notificar rechazo por email
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={config.notificar_rechazo} onChange={(e) => updateConfig({ notificar_rechazo: e.target.checked })} className="sr-only peer" />
                    <div className="w-8 h-4 bg-white/10 peer-checked:bg-green-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-beige/40 peer-checked:after:bg-green-400 after:rounded-full after:h-3 after:w-3 after:transition-all" />
                  </label>
                </span>
              </label>
              <p className="text-beige/20 text-[10px] mt-2">Enviar email al cliente si se rechaza su verificación</p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => { setShowSettings(false); toast.success("Configuración guardada"); }}>
              <Save className="w-4 h-4" /> Guardar
            </Button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "text-beige/60", onClick: () => setFilter("todos") },
          { label: "Verificados", value: stats.verificados, icon: ShieldCheck, color: "text-green-400", onClick: () => setFilter("verificado") },
          { label: "Pendientes", value: stats.pendientes, icon: Clock, color: "text-beige/40", onClick: () => setFilter("pendiente") },
          { label: "En revisión", value: stats.revision, icon: ShieldAlert, color: "text-yellow-400", onClick: () => setFilter("revision") },
          { label: "Rechazados", value: stats.rechazados, icon: XCircle, color: "text-red-400", onClick: () => setFilter("rechazado") },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className={`bg-white/5 border rounded-xl p-4 text-left transition-colors ${
              filter === stat.label.toLowerCase() || (stat.label === "Total" && filter === "todos")
                ? "border-oro/30 bg-oro/5"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-white text-xl font-bold">{stat.value}</p>
            <p className="text-beige/40 text-xs">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Validations table */}
      {filtered.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <ScanFace className="w-10 h-10 text-beige/15 mx-auto mb-3" />
          <p className="text-beige/40 text-sm">No hay validaciones {filter !== "todos" ? `con estado "${filter}"` : ""}</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-beige/40 text-xs font-medium px-4 py-3">Cliente</th>
                  <th className="text-left text-beige/40 text-xs font-medium px-4 py-3">Cédula</th>
                  <th className="text-center text-beige/40 text-xs font-medium px-4 py-3">Facial</th>
                  <th className="text-center text-beige/40 text-xs font-medium px-4 py-3">Datos</th>
                  <th className="text-center text-beige/40 text-xs font-medium px-4 py-3">Calidad</th>
                  <th className="text-center text-beige/40 text-xs font-medium px-4 py-3">Duplicado</th>
                  <th className="text-center text-beige/40 text-xs font-medium px-4 py-3">Estado</th>
                  <th className="text-left text-beige/40 text-xs font-medium px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a, b) => b.created_at.localeCompare(a.created_at)).map((val) => (
                  <tr key={val.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/validacion-identidad/${val.id}`} className="group">
                        <p className="text-white text-sm font-medium group-hover:text-oro transition-colors">{val.nombre}</p>
                        <p className="text-beige/30 text-xs">{val.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-beige/60 text-xs font-mono">{val.cedula}</td>
                    <td className="px-4 py-3 text-center">
                      {val.facial_score !== null ? (
                        <span className={`font-bold text-sm ${scoreColor(val.facial_score)}`}>{val.facial_score}%</span>
                      ) : (
                        <span className="text-beige/20 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {val.datos_match === null ? <span className="text-beige/20 text-xs">—</span>
                        : val.datos_match ? <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                        : <AlertTriangle className="w-4 h-4 text-yellow-400 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {val.calidad_selfie === null ? <span className="text-beige/20 text-xs">—</span>
                        : val.calidad_selfie && val.calidad_cedula ? <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                        : <AlertTriangle className="w-4 h-4 text-red-400 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {val.duplicado_cedula || val.duplicado_cara ? (
                        <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">DUP</span>
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-400/50 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(val.status)}</td>
                    <td className="px-4 py-3 text-beige/30 text-xs">{new Date(val.created_at).toLocaleDateString("es-CO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
