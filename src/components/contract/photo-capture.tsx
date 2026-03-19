"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Check } from "lucide-react";

interface PhotoCaptureProps {
  onPhoto: (dataUrl: string) => void;
  label?: string;
  guide?: "circle" | "card";
  facingMode?: "user" | "environment";
}

export default function PhotoCapture({
  onPhoto,
  label = "Tomar foto",
  guide,
  facingMode = "user",
}: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string>("");
  const [error, setError] = useState("");

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: guide === "card" ? 640 : 480,
          height: guide === "card" ? 400 : 480,
        },
      });
      setStream(mediaStream);
      setError("");
    } catch {
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  }, [facingMode, guide]);

  // Attach stream to video element after render
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const capture = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhoto(dataUrl);
    onPhoto(dataUrl);
    // Stop camera
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream, onPhoto]);

  const retake = useCallback(() => {
    setPhoto("");
    onPhoto("");
    startCamera();
  }, [startCamera, onPhoto]);

  // Sizes based on guide type
  const isCard = guide === "card";
  const containerClass = isCard
    ? "w-full max-w-[320px] aspect-[8.5/5.4] mx-auto"
    : "w-44 h-44 mx-auto";

  if (photo) {
    return (
      <div className="space-y-3">
        <div className={`relative ${containerClass} rounded-xl overflow-hidden border-2 border-green-500/30`}>
          <img src={photo} alt="Foto capturada" className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
        <button
          type="button"
          onClick={retake}
          className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 mx-auto py-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Tomar otra
        </button>
      </div>
    );
  }

  if (stream) {
    return (
      <div className="space-y-3">
        <div className={`relative ${containerClass} rounded-xl overflow-hidden border-2 border-white/20`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Circle overlay for selfie */}
          {guide === "circle" && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Semi-transparent mask with circle cutout */}
              <svg className="w-full h-full" viewBox="0 0 176 176">
                <defs>
                  <mask id="circle-mask">
                    <rect width="176" height="176" fill="white" />
                    <circle cx="88" cy="88" r="70" fill="black" />
                  </mask>
                </defs>
                <rect width="176" height="176" fill="rgba(0,0,0,0.5)" mask="url(#circle-mask)" />
                <circle cx="88" cy="88" r="70" fill="none" stroke="rgba(194,150,19,0.6)" strokeWidth="2" strokeDasharray="8 4" />
              </svg>
            </div>
          )}
          {/* Card overlay for cedula */}
          {guide === "card" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[85%] aspect-[8.5/5.4] border-2 border-dashed border-oro/60 rounded-lg" />
              <div className="absolute inset-0 border-[16px] border-black/40 rounded-xl" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={capture}
          className="flex items-center gap-2 text-sm bg-oro/20 text-oro px-5 py-2.5 rounded-xl mx-auto hover:bg-oro/30 transition-colors font-medium"
        >
          <Camera className="w-4 h-4" /> Capturar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      <button
        type="button"
        onClick={startCamera}
        className="flex items-center gap-2 text-sm bg-white/10 text-white px-5 py-3 rounded-xl mx-auto hover:bg-white/15 transition-colors border border-white/10 font-medium"
      >
        <Camera className="w-4 h-4" /> {label}
      </button>
    </div>
  );
}
