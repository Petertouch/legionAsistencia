"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Check, X, PenTool } from "lucide-react";

interface SignaturePadProps {
  onSignature: (dataUrl: string) => void;
}

export default function SignaturePad({ onSignature }: SignaturePadProps) {
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const handleDone = (dataUrl: string) => {
    setSignatureData(dataUrl);
    setHasSignature(true);
    onSignature(dataUrl);
    setFullscreen(false);
  };

  const handleClear = () => {
    setSignatureData("");
    setHasSignature(false);
    onSignature("");
  };

  return (
    <div className="space-y-2">
      {/* Preview / trigger */}
      {hasSignature && signatureData ? (
        <div className="relative">
          <img src={signatureData} alt="Firma" className="w-full h-32 border-2 border-green-300 rounded-lg bg-white object-contain" />
          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button type="button" onClick={() => setFullscreen(true)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
              <PenTool className="w-3 h-3" /> Firmar de nuevo
            </button>
            <button type="button" onClick={handleClear} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
              <Eraser className="w-3 h-3" /> Borrar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white flex flex-col items-center justify-center gap-2 hover:border-oro/50 hover:bg-oro/5 transition-colors"
        >
          <PenTool className="w-6 h-6 text-gray-400" />
          <span className="text-gray-500 text-sm font-medium">Toca aquí para firmar</span>
        </button>
      )}

      {/* Fullscreen signature modal */}
      {fullscreen && (
        <FullscreenSignature
          onDone={handleDone}
          onCancel={() => setFullscreen(false)}
        />
      )}
    </div>
  );
}

function FullscreenSignature({ onDone, onCancel }: { onDone: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Fill entire available space
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; // 2x for retina
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Lock body scroll
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawn) setHasDrawn(true);
  };

  const endDraw = () => { setIsDrawing(false); };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    if (!canvasRef.current || !hasDrawn) return;
    onDone(canvasRef.current.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium">
          <X className="w-4 h-4" /> Cancelar
        </button>
        <p className="text-gray-900 font-bold text-sm">Tu firma</p>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium"
        >
          <Eraser className="w-3.5 h-3.5" /> Borrar
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <PenTool className="w-10 h-10 text-gray-200 mb-2" />
            <p className="text-gray-300 text-base font-medium">Gira el celular horizontal</p>
            <p className="text-gray-300 text-sm mt-1">y firma aquí con tu dedo →</p>
          </div>
        )}
        {/* Event overlay */}
        <div
          className="absolute inset-0"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          style={{ touchAction: "none" }}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!hasDrawn}
          className="w-full bg-gradient-to-r from-oro to-oro-light text-white font-bold py-3.5 rounded-xl text-base transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 shadow-md"
        >
          <Check className="w-5 h-5" /> Confirmar firma
        </button>
      </div>
    </div>
  );
}
