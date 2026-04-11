"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Camera, CreditCard, ScanFace, Loader2, CheckCircle,
  AlertTriangle, Trash2, ZoomIn, ZoomOut,
} from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "sonner";
import { useIdentityStore } from "@/lib/stores/identity-store";

export default function ProbarValidacionPage() {
  const config = useIdentityStore((s) => s.config);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [cedula, setCedula] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [validatingSelfie, setValidatingSelfie] = useState(false);
  const [validatingCedula, setValidatingCedula] = useState(false);
  const [selfieValid, setSelfieValid] = useState<boolean | null>(null);
  const [cedulaValid, setCedulaValid] = useState<boolean | null>(null);
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

  const selfieVideoRef = useRef<HTMLVideoElement>(null);
  const cedulaVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState<"selfie" | "cedula" | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cedulaZoom, setCedulaZoom] = useState(1);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => { cameraStream?.getTracks().forEach((t) => t.stop()); };
  }, [cameraStream]);

  // ── Camera (selfie = frontal HD, cédula = trasera HD) ──
  async function startCamera(target: "selfie" | "cedula") {
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Tu navegador no soporta el acceso a la cámara");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: target === "selfie" ? "user" : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setCameraStream(stream);
      setCameraActive(target);
      setCedulaZoom(1);
      setTimeout(() => {
        const videoEl = target === "selfie" ? selfieVideoRef.current : cedulaVideoRef.current;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.play();
        }
      }, 100);
    } catch (err) {
      const e = err as DOMException;
      const name = e?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        toast.error("Permiso denegado. Activa la cámara en los ajustes del navegador");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        toast.error("No se detectó ninguna cámara en este dispositivo");
      } else if (name === "NotReadableError") {
        toast.error("La cámara está siendo usada por otra aplicación");
      } else {
        toast.error(`No se pudo acceder a la cámara${name ? ` (${name})` : ""}`);
      }
    }
  }

  // ── Countdown + Capture ──
  function startCountdown(target: "selfie" | "cedula") {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        doCapture(target);
      } else {
        setCountdown(count);
      }
    }, 1000);
  }

  async function doCapture(target: "selfie" | "cedula") {
    const videoEl = target === "selfie" ? selfieVideoRef.current : cedulaVideoRef.current;
    if (!videoEl) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d")!;

    // Auto brightness/contrast enhancement
    ctx.drawImage(videoEl, 0, 0);
    enhanceImage(ctx, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();

    if (target === "selfie") {
      setSelfie(dataUrl);
      setSelfieValid(null);
      setResult(null);
      // Validate immediately
      validateFace(dataUrl, "selfie");
    } else {
      setCedula(dataUrl);
      setCedulaValid(null);
      setResult(null);
      setOcrResult(null);
      validateFace(dataUrl, "cedula");
    }
  }

  // ── Auto brightness/contrast ──
  function enhanceImage(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Find min/max brightness
    let min = 255, max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness < min) min = brightness;
      if (brightness > max) max = brightness;
    }

    // Only enhance if image is too dark or low contrast
    if (max - min < 100 || max < 150) {
      const range = max - min || 1;
      const factor = 220 / range;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, (data[i] - min) * factor + 20));
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - min) * factor + 20));
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - min) * factor + 20));
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }

  // ── Immediate face validation after capture ──
  async function validateFace(imageUrl: string, target: "selfie" | "cedula") {
    if (target === "selfie") setValidatingSelfie(true);
    else setValidatingCedula(true);

    try {
      const { checkImageQuality } = await import("@/lib/identity-engine");
      const result = await checkImageQuality(imageUrl);

      if (target === "selfie") {
        setSelfieValid(result.faceDetected);
        if (!result.faceDetected) {
          toast.error("No se detectó cara en la selfie. Intenta de nuevo con mejor iluminación.");
        } else {
          toast.success(`Cara detectada (${result.confidence}% confianza)`);
        }
      } else {
        setCedulaValid(result.faceDetected);
        if (!result.faceDetected) {
          toast.error("No se detectó cara en la cédula. Acerca más el documento y asegúrate de que haya buena luz.");
        } else {
          toast.success(`Cara en cédula detectada (${result.confidence}% confianza)`);
        }
      }
    } catch {
      // Non-critical
    }

    if (target === "selfie") setValidatingSelfie(false);
    else setValidatingCedula(false);
  }

  function stopCamera() {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setCameraActive(null);
    setCountdown(null);
    setCedulaZoom(1);
  }

  // ── Zoom for cédula ──
  function adjustZoom(delta: number) {
    setCedulaZoom((z) => Math.max(1, Math.min(3, z + delta)));
  }

  // ── Run face comparison ──
  async function runComparison() {
    if (!selfie || !cedula) { toast.error("Necesitas ambas fotos"); return; }
    setProcessing(true);
    setResult(null);
    try {
      const { compareFaces } = await import("@/lib/identity-engine");
      const res = await compareFaces(selfie, cedula);
      setResult(res);
      if (res.score >= config.umbral_facial) toast.success(`Match: ${res.score}% — Aprobado`);
      else if (res.score >= 50) toast("Match parcial: " + res.score + "% — Revisar", { icon: "⚠️" });
      else toast.error(`Match bajo: ${res.score}% — No coincide`);
    } catch { toast.error("Error procesando las imágenes"); }
    setProcessing(false);
  }

  // ── Run OCR ──
  async function runOcr() {
    if (!cedula) { toast.error("Toma la foto de la cédula primero"); return; }
    setOcrProcessing(true);
    try {
      const { extractCedulaText } = await import("@/lib/identity-engine");
      const res = await extractCedulaText(cedula);
      setOcrResult(res);
      toast.success("OCR completado");
    } catch { toast.error("Error procesando OCR"); }
    setOcrProcessing(false);
  }

  function reset() {
    setSelfie(null); setCedula(null); setResult(null); setOcrResult(null);
    setSelfieValid(null); setCedulaValid(null); stopCamera();
  }

  const scoreColor = (s: number) => s >= 80 ? "text-green-600" : s >= 60 ? "text-yellow-600" : "text-red-600";
  const scoreBg = (s: number) => s >= 80 ? "bg-green-50" : s >= 60 ? "bg-yellow-50" : "bg-red-100";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/validacion-identidad" className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <ScanFace className="w-6 h-6 text-oro" /> Probar validación
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Toma una selfie y una foto de tu cédula para probar el sistema</p>
        </div>
        {(selfie || cedula) && (
          <button onClick={reset} className="text-gray-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Limpiar todo
          </button>
        )}
      </div>

      {/* Photo inputs — side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* ══ SELFIE ══ */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900 text-sm font-bold flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" /> Selfie
            </h3>
            {selfie && (
              <button onClick={() => { setSelfie(null); setResult(null); setSelfieValid(null); }} className="text-gray-400 hover:text-red-600 text-xs">Repetir</button>
            )}
          </div>

          {cameraActive === "selfie" ? (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-[3/4] bg-black">
                <video ref={selfieVideoRef} className="w-full h-full object-cover" muted playsInline />
                {/* Oval guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[55%] h-[70%] border-2 border-oro/50 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                </div>
                <p className="absolute bottom-3 left-0 right-0 text-center text-gray-900/70 text-xs font-medium">Centra tu cara en el óvalo</p>
                {/* Countdown overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-8xl font-black text-oro animate-pulse">{countdown}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => startCountdown("selfie")} disabled={countdown !== null} className="flex-1">
                  <Camera className="w-4 h-4" /> {countdown !== null ? `${countdown}...` : "Capturar (3s)"}
                </Button>
                <Button size="sm" variant="ghost" onClick={stopCamera}>Cancelar</Button>
              </div>
            </div>
          ) : selfie ? (
            <div className="relative">
              <img src={selfie} alt="Selfie" className="w-full rounded-lg border border-gray-200 aspect-[3/4] object-cover" />
              {/* Validation badge */}
              <div className="absolute bottom-2 left-2 right-2">
                {validatingSelfie ? (
                  <span className="bg-black/70 text-gray-900 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit"><Loader2 className="w-3 h-3 animate-spin" /> Verificando cara...</span>
                ) : selfieValid === true ? (
                  <span className="bg-green-600/90 text-gray-900 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit"><CheckCircle className="w-3 h-3" /> Cara detectada</span>
                ) : selfieValid === false ? (
                  <span className="bg-red-600/90 text-gray-900 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit"><AlertTriangle className="w-3 h-3" /> No se detectó cara — repite</span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 aspect-[3/4] flex flex-col items-center justify-center gap-3">
                <Camera className="w-12 h-12 text-beige/15" />
                <p className="text-gray-300 text-sm text-center px-4">Toma una selfie</p>
                <p className="text-beige/15 text-[10px] text-center px-6">Buena iluminación, sin gafas de sol, mirando a la cámara</p>
              </div>
              <Button size="sm" onClick={() => startCamera("selfie")} className="w-full"><Camera className="w-4 h-4" /> Abrir cámara</Button>
            </div>
          )}
        </div>

        {/* ══ CÉDULA ══ */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900 text-sm font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" /> Cédula (frente)
            </h3>
            {cedula && (
              <button onClick={() => { setCedula(null); setResult(null); setOcrResult(null); setCedulaValid(null); }} className="text-gray-400 hover:text-red-600 text-xs">Repetir</button>
            )}
          </div>

          {cameraActive === "cedula" ? (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-[3/4] bg-black">
                <video
                  ref={cedulaVideoRef}
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{ transform: `scale(${cedulaZoom})` }}
                  muted
                  playsInline
                />
                {/* Rectangle guide for cédula */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[80%] h-[50%] border-2 border-purple-400/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                    <div className="absolute -top-6 left-0 right-0 text-center text-gray-900/70 text-[10px]">Ubica la cédula dentro del recuadro</div>
                  </div>
                </div>
                {/* Countdown */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-8xl font-black text-purple-600 animate-pulse">{countdown}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => startCountdown("cedula")} disabled={countdown !== null} className="flex-1">
                  <Camera className="w-4 h-4" /> {countdown !== null ? `${countdown}...` : "Capturar (3s)"}
                </Button>
                {/* Zoom controls */}
                <button onClick={() => adjustZoom(-0.5)} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-900 transition-colors" title="Alejar">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button onClick={() => adjustZoom(0.5)} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-900 transition-colors" title="Acercar">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <Button size="sm" variant="ghost" onClick={stopCamera}>X</Button>
              </div>
              <p className="text-gray-300 text-[10px] text-center">Zoom: {cedulaZoom.toFixed(1)}x — Acerca la cédula para mejor detalle</p>
            </div>
          ) : cedula ? (
            <div className="relative">
              <img src={cedula} alt="Cédula" className="w-full rounded-lg border border-gray-200 aspect-[3/4] object-contain bg-black/30" />
              <div className="absolute bottom-2 left-2 right-2">
                {validatingCedula ? (
                  <span className="bg-black/70 text-gray-900 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit"><Loader2 className="w-3 h-3 animate-spin" /> Verificando cara en cédula...</span>
                ) : cedulaValid === true ? (
                  <span className="bg-green-600/90 text-gray-900 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit"><CheckCircle className="w-3 h-3" /> Cara detectada en cédula</span>
                ) : cedulaValid === false ? (
                  <span className="bg-red-600/90 text-gray-900 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit"><AlertTriangle className="w-3 h-3" /> No se detectó cara — acerca más</span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 aspect-[3/4] flex flex-col items-center justify-center gap-3">
                <CreditCard className="w-12 h-12 text-beige/15" />
                <p className="text-gray-300 text-sm text-center px-4">Toma foto de tu cédula</p>
                <p className="text-beige/15 text-[10px] text-center px-6">Frente del documento, plano, buena luz, sin reflejos</p>
              </div>
              <Button size="sm" onClick={() => startCamera("cedula")} className="w-full"><Camera className="w-4 h-4" /> Abrir cámara</Button>
            </div>
          )}
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
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-gray-900 text-sm font-bold">Resultado de comparación facial</h3>

          <div className="flex items-center justify-center py-4">
            <div className={`w-36 h-36 rounded-full ${scoreBg(result.score)} flex flex-col items-center justify-center`}>
              <span className={`text-5xl font-black ${scoreColor(result.score)}`}>{result.score}%</span>
              <span className={`text-xs font-medium mt-1 ${scoreColor(result.score)}`}>
                {result.score >= 80 ? "Match alto" : result.score >= 60 ? "Match parcial" : "Match bajo"}
              </span>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${result.score >= 80 ? "bg-green-400" : result.score >= 60 ? "bg-yellow-400" : "bg-red-400"}`} style={{ width: `${result.score}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-gray-300">
              <span>0%</span>
              <span className="text-oro font-bold">Umbral: {config.umbral_facial}%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { label: "Cara en selfie", ok: result.selfieDetected, value: result.selfieDetected ? `${result.selfieConfidence}%` : "No detectada" },
              { label: "Cara en cédula", ok: result.cedulaDetected, value: result.cedulaDetected ? `${result.cedulaConfidence}%` : "No detectada" },
              { label: "Pasa umbral", ok: result.score >= config.umbral_facial, value: result.score >= config.umbral_facial ? "Sí" : "No" },
              { label: "Veredicto", ok: result.score >= config.umbral_facial, value: result.score >= config.umbral_facial ? "Verificado" : result.score >= 50 ? "Revisar" : "Rechazado" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                {item.ok ? <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" /> : <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-1" />}
                <p className="text-gray-500 text-xs">{item.label}</p>
                <p className={`text-sm font-bold ${item.ok ? "text-green-600" : "text-red-600"}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OCR Result */}
      {ocrResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
          <h3 className="text-gray-900 text-sm font-bold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-600" /> Datos extraídos por OCR
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Nombre detectado</p>
              <p className="text-gray-900 text-sm font-medium">{ocrResult.nombre || <span className="text-gray-300 italic">No detectado</span>}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Cédula detectada</p>
              <p className="text-gray-900 text-sm font-mono font-medium">{ocrResult.cedula || <span className="text-gray-300 italic">No detectado</span>}</p>
            </div>
          </div>
          <details className="text-gray-300 text-xs">
            <summary className="cursor-pointer hover:text-gray-400 transition-colors">Ver texto completo extraído</summary>
            <pre className="mt-2 bg-black/30 rounded-lg p-3 text-gray-400 text-[11px] whitespace-pre-wrap overflow-auto max-h-40">{ocrResult.rawText}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
