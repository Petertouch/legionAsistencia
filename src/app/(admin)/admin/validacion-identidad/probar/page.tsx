"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Camera, CreditCard, ScanFace, Loader2, CheckCircle,
  AlertTriangle, Upload, RefreshCw, Trash2,
} from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "sonner";
import { useIdentityStore } from "@/lib/stores/identity-store";

export default function ProbarValidacionPage() {
  const config = useIdentityStore((s) => s.config);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [cedula, setCedula] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    selfieDetected: boolean;
    cedulaDetected: boolean;
    selfieConfidence: number;
    cedulaConfidence: number;
  } | null>(null);
  const [ocrResult, setOcrResult] = useState<{
    nombre: string | null;
    cedula: string | null;
    rawText: string;
  } | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const selfieInputRef = useRef<HTMLInputElement>(null);
  const cedulaInputRef = useRef<HTMLInputElement>(null);
  const selfieVideoRef = useRef<HTMLVideoElement>(null);
  const cedulaVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState<"selfie" | "cedula" | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // ── Handle file uploads ──
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, target: "selfie" | "cedula") {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (target === "selfie") { setSelfie(reader.result as string); setResult(null); }
      else { setCedula(reader.result as string); setResult(null); setOcrResult(null); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // ── Camera (selfie = frontal, cédula = trasera) ──
  async function startCamera(target: "selfie" | "cedula") {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: target === "selfie" ? "user" : "environment",
          width: 640,
          height: 480,
        },
      });
      setCameraStream(stream);
      setCameraActive(target);
      setTimeout(() => {
        const videoEl = target === "selfie" ? selfieVideoRef.current : cedulaVideoRef.current;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.play();
        }
      }, 100);
    } catch {
      toast.error("No se pudo acceder a la cámara");
    }
  }

  function capturePhoto(target: "selfie" | "cedula") {
    const videoEl = target === "selfie" ? selfieVideoRef.current : cedulaVideoRef.current;
    if (!videoEl) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    canvas.getContext("2d")!.drawImage(videoEl, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (target === "selfie") setSelfie(dataUrl);
    else setCedula(dataUrl);
    stopCamera();
    setResult(null);
    setOcrResult(null);
  }

  function stopCamera() {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setCameraActive(null);
  }

  // ── Run face comparison ──
  async function runComparison() {
    if (!selfie || !cedula) {
      toast.error("Necesitas ambas fotos: selfie y cédula");
      return;
    }
    setProcessing(true);
    setResult(null);
    try {
      const { compareFaces } = await import("@/lib/identity-engine");
      const res = await compareFaces(selfie, cedula);
      setResult(res);
      if (res.score >= config.umbral_facial) {
        toast.success(`Match: ${res.score}% — Aprobado`);
      } else if (res.score >= 50) {
        toast("Match parcial: " + res.score + "% — Revisar", { icon: "⚠️" });
      } else {
        toast.error(`Match bajo: ${res.score}% — No coincide`);
      }
    } catch (err) {
      toast.error("Error procesando las imágenes");
    }
    setProcessing(false);
  }

  // ── Run OCR on cédula ──
  async function runOcr() {
    if (!cedula) { toast.error("Sube una foto de la cédula primero"); return; }
    setOcrProcessing(true);
    try {
      const { extractCedulaText } = await import("@/lib/identity-engine");
      const res = await extractCedulaText(cedula);
      setOcrResult(res);
      toast.success("OCR completado");
    } catch {
      toast.error("Error procesando OCR");
    }
    setOcrProcessing(false);
  }

  function reset() {
    setSelfie(null);
    setCedula(null);
    setResult(null);
    setOcrResult(null);
    stopCamera();
  }

  const scoreColor = (s: number) => s >= 80 ? "text-green-400" : s >= 60 ? "text-yellow-400" : "text-red-400";
  const scoreBg = (s: number) => s >= 80 ? "bg-green-500/15" : s >= 60 ? "bg-yellow-500/15" : "bg-red-500/15";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/validacion-identidad" className="p-2 rounded-lg text-beige/40 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <ScanFace className="w-6 h-6 text-oro" /> Probar validación
          </h1>
          <p className="text-beige/40 text-sm mt-0.5">Sube o toma una selfie y una foto de cédula para probar el sistema</p>
        </div>
        {(selfie || cedula) && (
          <button onClick={reset} className="text-beige/40 hover:text-red-400 text-xs flex items-center gap-1 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Limpiar todo
          </button>
        )}
      </div>

      {/* Photo inputs — side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Selfie */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-sm font-bold flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" /> Selfie
            </h3>
            {selfie && (
              <button onClick={() => { setSelfie(null); setResult(null); }} className="text-beige/30 hover:text-red-400 text-xs">Quitar</button>
            )}
          </div>

          {cameraActive === "selfie" ? (
            <div className="space-y-2">
              <video ref={selfieVideoRef} className="w-full rounded-lg border border-white/10 aspect-[3/4] object-cover bg-black" muted playsInline />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => capturePhoto("selfie")} className="flex-1"><Camera className="w-4 h-4" /> Capturar</Button>
                <Button size="sm" variant="ghost" onClick={stopCamera}>Cancelar</Button>
              </div>
            </div>
          ) : selfie ? (
            <img src={selfie} alt="Selfie" className="w-full rounded-lg border border-white/10 aspect-[3/4] object-cover" />
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] aspect-[3/4] flex flex-col items-center justify-center gap-3">
                <Camera className="w-10 h-10 text-beige/15" />
                <p className="text-beige/25 text-xs text-center px-4">Toma una selfie con la cámara</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => startCamera("selfie")} className="w-full"><Camera className="w-4 h-4" /> Tomar selfie</Button>
            </div>
          )}
          <input ref={selfieInputRef} type="file" accept="image/*" capture="user" onChange={(e) => handleFileSelect(e, "selfie")} className="hidden" />
        </div>

        {/* Cédula */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-sm font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" /> Cédula (frente)
            </h3>
            {cedula && (
              <button onClick={() => { setCedula(null); setResult(null); setOcrResult(null); }} className="text-beige/30 hover:text-red-400 text-xs">Quitar</button>
            )}
          </div>

          {cameraActive === "cedula" ? (
            <div className="space-y-2">
              <video ref={cedulaVideoRef} className="w-full rounded-lg border border-white/10 aspect-[3/4] object-cover bg-black" muted playsInline />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => capturePhoto("cedula")} className="flex-1"><Camera className="w-4 h-4" /> Capturar</Button>
                <Button size="sm" variant="ghost" onClick={stopCamera}>Cancelar</Button>
              </div>
            </div>
          ) : cedula ? (
            <img src={cedula} alt="Cédula" className="w-full rounded-lg border border-white/10 aspect-[3/4] object-contain bg-black/30" />
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] aspect-[3/4] flex flex-col items-center justify-center gap-3">
                <CreditCard className="w-10 h-10 text-beige/15" />
                <p className="text-beige/25 text-xs text-center px-4">Toma foto del frente de la cédula</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => startCamera("cedula")} className="w-full"><Camera className="w-4 h-4" /> Tomar foto cédula</Button>
            </div>
          )}
          <input ref={cedulaInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => handleFileSelect(e, "cedula")} className="hidden" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button onClick={runComparison} disabled={!selfie || !cedula || processing} className="flex-1 sm:flex-none">
          {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Comparando caras...</> : <><ScanFace className="w-4 h-4" /> Comparar caras</>}
        </Button>
        <Button variant="ghost" onClick={runOcr} disabled={!cedula || ocrProcessing}>
          {ocrProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Leyendo cédula...</> : <><CreditCard className="w-4 h-4" /> Extraer datos OCR</>}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="text-white text-sm font-bold">Resultado de comparación facial</h3>

          {/* Score big */}
          <div className="flex items-center justify-center py-4">
            <div className={`w-36 h-36 rounded-full ${scoreBg(result.score)} flex flex-col items-center justify-center`}>
              <span className={`text-5xl font-black ${scoreColor(result.score)}`}>{result.score}%</span>
              <span className={`text-xs font-medium mt-1 ${scoreColor(result.score)}`}>
                {result.score >= 80 ? "Match alto" : result.score >= 60 ? "Match parcial" : "Match bajo"}
              </span>
            </div>
          </div>

          {/* Score bar */}
          <div className="max-w-md mx-auto">
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  result.score >= 80 ? "bg-green-400" : result.score >= 60 ? "bg-yellow-400" : "bg-red-400"
                }`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-beige/25">
              <span>0%</span>
              <span className="text-oro font-bold">Umbral: {config.umbral_facial}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="text-center">
              {result.selfieDetected ? <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" /> : <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />}
              <p className="text-beige/50 text-xs">Cara en selfie</p>
              <p className={`text-sm font-bold ${result.selfieDetected ? "text-green-400" : "text-red-400"}`}>
                {result.selfieDetected ? `${result.selfieConfidence}%` : "No detectada"}
              </p>
            </div>
            <div className="text-center">
              {result.cedulaDetected ? <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" /> : <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />}
              <p className="text-beige/50 text-xs">Cara en cédula</p>
              <p className={`text-sm font-bold ${result.cedulaDetected ? "text-green-400" : "text-red-400"}`}>
                {result.cedulaDetected ? `${result.cedulaConfidence}%` : "No detectada"}
              </p>
            </div>
            <div className="text-center">
              <div className={`w-5 h-5 mx-auto mb-1 rounded-full ${result.score >= config.umbral_facial ? "bg-green-500" : "bg-red-500"} flex items-center justify-center`}>
                {result.score >= config.umbral_facial ? <CheckCircle className="w-3 h-3 text-white" /> : <AlertTriangle className="w-3 h-3 text-white" />}
              </div>
              <p className="text-beige/50 text-xs">Pasa umbral</p>
              <p className={`text-sm font-bold ${result.score >= config.umbral_facial ? "text-green-400" : "text-red-400"}`}>
                {result.score >= config.umbral_facial ? "Sí" : "No"}
              </p>
            </div>
            <div className="text-center">
              <ScanFace className="w-5 h-5 text-oro mx-auto mb-1" />
              <p className="text-beige/50 text-xs">Veredicto</p>
              <p className={`text-sm font-bold ${result.score >= config.umbral_facial ? "text-green-400" : result.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                {result.score >= config.umbral_facial ? "Verificado" : result.score >= 50 ? "Revisar" : "Rechazado"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OCR Result */}
      {ocrResult && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
          <h3 className="text-white text-sm font-bold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-400" /> Datos extraídos por OCR
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-beige/40 text-xs mb-1">Nombre detectado</p>
              <p className="text-white text-sm font-medium">{ocrResult.nombre || <span className="text-beige/20 italic">No detectado</span>}</p>
            </div>
            <div>
              <p className="text-beige/40 text-xs mb-1">Cédula detectada</p>
              <p className="text-white text-sm font-mono font-medium">{ocrResult.cedula || <span className="text-beige/20 italic">No detectado</span>}</p>
            </div>
          </div>
          <details className="text-beige/20 text-xs">
            <summary className="cursor-pointer hover:text-beige/40 transition-colors">Ver texto completo extraído</summary>
            <pre className="mt-2 bg-black/30 rounded-lg p-3 text-beige/40 text-[11px] whitespace-pre-wrap overflow-auto max-h-40">{ocrResult.rawText}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
