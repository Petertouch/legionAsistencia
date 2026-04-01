"use client";

import { use, useState, useEffect } from "react";
import { useIdentityStore, type ValidationStatus } from "@/lib/stores/identity-store";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, ShieldAlert, XCircle, Loader2, ScanFace,
  CheckCircle, AlertTriangle, RefreshCw, Camera, CreditCard,
} from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "sonner";

export default function ValidacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const validation = useIdentityStore((s) => s.validations.find((v) => v.id === id));
  const updateValidation = useIdentityStore((s) => s.updateValidation);
  const config = useIdentityStore((s) => s.config);

  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [cedulaUrl, setCedulaUrl] = useState<string | null>(null);
  const [cedulaReversoUrl, setCedulaReversoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);
  const [notas, setNotas] = useState(validation?.notas || "");

  // Load photos from contract
  useEffect(() => {
    if (!validation) return;
    loadPhotos();
  }, [validation?.contrato_id]);

  async function loadPhotos() {
    if (!validation) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("contratos")
      .select("foto_data, cedula_frente_data, cedula_reverso_data")
      .eq("id", validation.contrato_id)
      .single();

    if (data) {
      setSelfieUrl(data.foto_data || null);
      setCedulaUrl(data.cedula_frente_data || null);
      setCedulaReversoUrl(data.cedula_reverso_data || null);
    }
    setLoading(false);
  }

  // Re-run validation
  async function revalidate() {
    if (!selfieUrl || !cedulaUrl || !validation) return;
    setRevalidating(true);

    try {
      const { compareFaces, extractCedulaText, compareData } = await import("@/lib/identity-engine");

      // Face comparison
      const faceResult = await compareFaces(selfieUrl, cedulaUrl);

      // OCR
      let ocrNombre: string | null = null;
      let ocrCedula: string | null = null;
      let datosMatch: boolean | null = null;
      try {
        const ocrResult = await extractCedulaText(cedulaUrl);
        ocrNombre = ocrResult.nombre;
        ocrCedula = ocrResult.cedula;
        const dataComp = compareData(ocrNombre, ocrCedula, validation.nombre, validation.cedula);
        datosMatch = dataComp.nombreMatch || dataComp.cedulaMatch;
      } catch { /* OCR optional */ }

      // Determine status
      let status: ValidationStatus = "revision";
      if (faceResult.score >= config.umbral_facial && faceResult.selfieDetected && faceResult.cedulaDetected && !validation.duplicado_cedula) {
        status = config.auto_aprobar ? "verificado" : "revision";
      }

      updateValidation(validation.id, {
        facial_score: faceResult.score,
        calidad_selfie: faceResult.selfieDetected,
        calidad_cedula: faceResult.cedulaDetected,
        datos_match: datosMatch,
        ocr_nombre: ocrNombre,
        ocr_cedula: ocrCedula,
        status,
      });

      toast.success("Validación actualizada");
    } catch (err) {
      toast.error("Error ejecutando validación");
    }

    setRevalidating(false);
  }

  function approve() {
    if (!validation) return;
    updateValidation(validation.id, { status: "verificado", revisado_por: "admin", notas });
    toast.success("Identidad verificada");
  }

  function reject() {
    if (!validation) return;
    updateValidation(validation.id, { status: "rechazado", revisado_por: "admin", notas });
    toast.success("Identidad rechazada");
  }

  if (!validation) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-beige/40 text-sm">Validación no encontrada</p>
        <Link href="/admin/validacion-identidad" className="text-oro text-sm mt-2 hover:underline">Volver</Link>
      </div>
    );
  }

  const scoreColor = (s: number | null) => {
    if (s === null) return "text-beige/20";
    if (s >= 80) return "text-green-400";
    if (s >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const scoreBg = (s: number | null) => {
    if (s === null) return "bg-white/10";
    if (s >= 80) return "bg-green-500/15";
    if (s >= 60) return "bg-yellow-500/15";
    return "bg-red-500/15";
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/validacion-identidad" className="p-2 rounded-lg text-beige/40 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white text-xl font-bold">{validation.nombre}</h1>
          <p className="text-beige/40 text-sm">CC {validation.cedula} · {validation.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {validation.status === "verificado" && <ShieldCheck className="w-6 h-6 text-green-400" />}
          {validation.status === "revision" && <ShieldAlert className="w-6 h-6 text-yellow-400" />}
          {validation.status === "rechazado" && <XCircle className="w-6 h-6 text-red-400" />}
          <span className={`text-sm font-bold capitalize ${
            validation.status === "verificado" ? "text-green-400" : validation.status === "rechazado" ? "text-red-400" : validation.status === "revision" ? "text-yellow-400" : "text-beige/40"
          }`}>
            {validation.status}
          </span>
        </div>
      </div>

      {/* Facial comparison — side by side */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-sm font-bold flex items-center gap-2">
            <ScanFace className="w-4 h-4 text-oro" /> Comparación facial
          </h2>
          <Button size="sm" variant="ghost" onClick={revalidate} disabled={revalidating || !selfieUrl || !cedulaUrl}>
            {revalidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {revalidating ? "Procesando..." : "Re-validar"}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-oro animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Selfie */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-beige/50 text-xs">
                <Camera className="w-3.5 h-3.5" /> Selfie del cliente
              </div>
              {selfieUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 aspect-[3/4]">
                  <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2">
                    {validation.calidad_selfie === true ? (
                      <span className="bg-green-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Cara detectada</span>
                    ) : validation.calidad_selfie === false ? (
                      <span className="bg-red-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> No detectada</span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] aspect-[3/4] flex items-center justify-center">
                  <p className="text-beige/20 text-xs">Sin selfie</p>
                </div>
              )}
            </div>

            {/* Score center */}
            <div className="flex flex-col items-center justify-center">
              <div className={`w-28 h-28 rounded-full ${scoreBg(validation.facial_score)} flex items-center justify-center mb-3`}>
                {validation.facial_score !== null ? (
                  <span className={`text-4xl font-black ${scoreColor(validation.facial_score)}`}>{validation.facial_score}%</span>
                ) : (
                  <span className="text-beige/20 text-sm">Sin score</span>
                )}
              </div>
              <p className="text-white text-sm font-bold mb-1">
                {validation.facial_score !== null
                  ? validation.facial_score >= 80 ? "Match alto" : validation.facial_score >= 60 ? "Match parcial" : "Match bajo"
                  : "Sin validar"}
              </p>
              <p className="text-beige/30 text-xs text-center">
                Umbral mínimo: {config.umbral_facial}%
              </p>

              {/* Score bar */}
              {validation.facial_score !== null && (
                <div className="w-full max-w-[200px] mt-3">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        validation.facial_score >= 80 ? "bg-green-400" : validation.facial_score >= 60 ? "bg-yellow-400" : "bg-red-400"
                      }`}
                      style={{ width: `${validation.facial_score}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] text-beige/20">
                    <span>0%</span>
                    <span className="text-oro">Umbral {config.umbral_facial}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Cédula */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-beige/50 text-xs">
                <CreditCard className="w-3.5 h-3.5" /> Foto de cédula
              </div>
              {cedulaUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 aspect-[3/4]">
                  <img src={cedulaUrl} alt="Cédula frente" className="w-full h-full object-contain bg-black/50" />
                  <div className="absolute bottom-2 left-2">
                    {validation.calidad_cedula === true ? (
                      <span className="bg-green-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Cara detectada</span>
                    ) : validation.calidad_cedula === false ? (
                      <span className="bg-red-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> No detectada</span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] aspect-[3/4] flex items-center justify-center">
                  <p className="text-beige/20 text-xs">Sin foto cédula</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation checks grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Comparación facial",
            value: validation.facial_score !== null ? `${validation.facial_score}%` : "Pendiente",
            ok: validation.facial_score !== null && validation.facial_score >= config.umbral_facial,
            pending: validation.facial_score === null,
          },
          {
            label: "Datos OCR",
            value: validation.datos_match === true ? "Coinciden" : validation.datos_match === false ? "No coinciden" : "Pendiente",
            ok: validation.datos_match === true,
            pending: validation.datos_match === null,
          },
          {
            label: "Calidad fotos",
            value: validation.calidad_selfie && validation.calidad_cedula ? "Aprobada" : !validation.calidad_selfie ? "Selfie mal" : !validation.calidad_cedula ? "Cédula mal" : "Pendiente",
            ok: validation.calidad_selfie === true && validation.calidad_cedula === true,
            pending: validation.calidad_selfie === null,
          },
          {
            label: "Duplicados",
            value: validation.duplicado_cedula ? "Cédula duplicada" : validation.duplicado_cara ? "Cara duplicada" : "Sin duplicados",
            ok: !validation.duplicado_cedula && !validation.duplicado_cara,
            pending: false,
          },
        ].map((check) => (
          <div key={check.label} className={`border rounded-xl p-4 ${check.pending ? "bg-white/5 border-white/10" : check.ok ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
            <div className="flex items-center gap-2 mb-1">
              {check.pending ? <span className="w-4 h-4 text-beige/30">—</span> : check.ok ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
              <span className="text-beige/50 text-xs">{check.label}</span>
            </div>
            <p className={`text-sm font-bold ${check.pending ? "text-beige/30" : check.ok ? "text-green-400" : "text-red-400"}`}>{check.value}</p>
          </div>
        ))}
      </div>

      {/* OCR Details */}
      {(validation.ocr_nombre || validation.ocr_cedula) && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-white text-sm font-bold mb-3">Datos extraídos por OCR</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-beige/40 text-xs mb-1">Nombre digitado</p>
              <p className="text-white">{validation.nombre}</p>
            </div>
            <div>
              <p className="text-beige/40 text-xs mb-1">Nombre en cédula (OCR)</p>
              <p className={validation.datos_match ? "text-green-400" : "text-yellow-400"}>{validation.ocr_nombre || "No detectado"}</p>
            </div>
            <div>
              <p className="text-beige/40 text-xs mb-1">Cédula digitada</p>
              <p className="text-white font-mono">{validation.cedula}</p>
            </div>
            <div>
              <p className="text-beige/40 text-xs mb-1">Cédula en documento (OCR)</p>
              <p className={validation.ocr_cedula === validation.cedula ? "text-green-400 font-mono" : "text-yellow-400 font-mono"}>{validation.ocr_cedula || "No detectado"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cédula reverso */}
      {cedulaReversoUrl && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-white text-sm font-bold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-beige/40" /> Cédula reverso</h3>
          <div className="max-w-sm">
            <img src={cedulaReversoUrl} alt="Cédula reverso" className="w-full rounded-lg border border-white/10 object-contain bg-black/30" />
          </div>
        </div>
      )}

      {/* Admin actions */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-white text-sm font-bold">Decisión del administrador</h3>
        <div>
          <label className="text-beige/60 text-xs font-medium mb-1.5 block">Notas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40 resize-none"
            placeholder="Notas sobre la verificación..."
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={approve} className="bg-green-600 hover:bg-green-700 border-green-500">
            <ShieldCheck className="w-4 h-4" /> Aprobar identidad
          </Button>
          <Button onClick={reject} className="bg-red-600 hover:bg-red-700 border-red-500">
            <XCircle className="w-4 h-4" /> Rechazar
          </Button>
          <Button variant="ghost" onClick={() => {
            updateValidation(validation.id, { status: "pendiente", notas });
            toast.info("Marcado como pendiente — se puede pedir nueva foto al cliente");
          }}>
            Pedir nueva foto
          </Button>
        </div>
      </div>
    </div>
  );
}
