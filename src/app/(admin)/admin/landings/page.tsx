"use client";

import { useState } from "react";
import QRCodeLib from "qrcode";
import { toast } from "sonner";
import {
  LANDINGS, CATEGORIA_LABEL, CATEGORIA_ORDER, ESTADO_LABEL, landingUrl,
  type Landing, type LandingCategoria,
} from "@/lib/landings";
import {
  Globe, ExternalLink, Copy, QrCode, Megaphone, Gift, FileText, X, Download,
} from "lucide-react";

const CAT_ICON: Record<LandingCategoria, typeof Globe> = {
  marketing: Megaphone,
  referidos: Gift,
  contenido: FileText,
};

const ESTADO_STYLE: Record<string, string> = {
  activa: "bg-green-50 text-green-600 border-green-200",
  legacy: "bg-gray-50 text-gray-400 border-gray-200",
  borrador: "bg-amber-50 text-oro border-amber-200",
};

export default function LandingsPage() {
  const [qr, setQr] = useState<{ landing: Landing; dataUrl: string } | null>(null);

  const copyLink = async (l: Landing) => {
    try {
      await navigator.clipboard.writeText(landingUrl(l));
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const showQr = async (l: Landing) => {
    try {
      const dataUrl = await QRCodeLib.toDataURL(landingUrl(l), { width: 480, margin: 2 });
      setQr({ landing: l, dataUrl });
    } catch {
      toast.error("No se pudo generar el QR");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 text-lg font-bold flex items-center gap-2">
          <Globe className="w-5 h-5 text-oro" /> Landings
        </h1>
        <p className="text-gray-400 text-xs mt-0.5">
          Todas las páginas públicas del sitio. Ábrelas, copia su link o genera un QR para compartir.
        </p>
      </div>

      {CATEGORIA_ORDER.map((cat) => {
        const items = LANDINGS.filter((l) => l.categoria === cat);
        if (items.length === 0) return null;
        const CatIcon = CAT_ICON[cat];

        return (
          <div key={cat} className="space-y-2">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 pt-1">
              <CatIcon className="w-3.5 h-3.5" /> {CATEGORIA_LABEL[cat]}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((l) => (
                <div key={l.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-gray-900 text-sm font-semibold truncate">{l.nombre}</p>
                      <p className="text-oro/70 text-xs font-mono mt-0.5 truncate">{l.ruta}</p>
                    </div>
                    <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${ESTADO_STYLE[l.estado]}`}>
                      {ESTADO_LABEL[l.estado]}
                    </span>
                  </div>

                  <p className="text-gray-500 text-xs leading-relaxed mt-2 flex-1">{l.descripcion}</p>

                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    <a
                      href={landingUrl(l)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver
                    </a>
                    <button
                      onClick={() => copyLink(l)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar link
                    </button>
                    <button
                      onClick={() => showQr(l)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" /> QR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Modal QR */}
      {qr && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setQr(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQr(null)}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-gray-900 text-sm font-bold">{qr.landing.nombre}</p>
            <p className="text-oro/70 text-xs font-mono mb-3">{qr.landing.ruta}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.dataUrl} alt={`QR ${qr.landing.nombre}`} className="w-full rounded-lg border border-gray-200" />
            <a
              href={qr.dataUrl}
              download={`qr-${qr.landing.id}.png`}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Descargar QR
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
