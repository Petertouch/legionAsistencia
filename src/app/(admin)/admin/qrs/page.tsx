"use client";

import { useState, useEffect, useCallback } from "react";
import { QrCode, Download, Plus, Trash2, Copy, ExternalLink, Check } from "lucide-react";
import QRCodeLib from "qrcode";
import Button from "@/components/ui/button";
import { toast } from "sonner";

const BASE_URL = "https://legionjuridica.com";

interface QRItem {
  id: string;
  label: string;
  description: string;
  url: string;
  removable: boolean;
}

const DEFAULT_QRS: QRItem[] = [
  {
    id: "landing",
    label: "Landing principal",
    description: "Página principal de Legión Jurídica con planes y beneficios",
    url: BASE_URL,
    removable: false,
  },
  {
    id: "lanzas-registro",
    label: "Registro de Lanzas",
    description: "Para militares y policías que quieren ser aliados referidores",
    url: `${BASE_URL}/aliados/registro`,
    removable: false,
  },
  {
    id: "esposa-registro",
    label: "Registro de Esposas",
    description: "Para esposas de militares y policías que quieren referir",
    url: `${BASE_URL}/esposa`,
    removable: false,
  },
  {
    id: "cliente-registro",
    label: "Registro de Cliente",
    description: "Para militares o policías que quieren afiliarse al servicio",
    url: `${BASE_URL}/r/GENERAL`,
    removable: false,
  },
  {
    id: "blog",
    label: "Guía Legal Militar",
    description: "Blog con consultas gratuitas y artículos legales",
    url: `${BASE_URL}/blog`,
    removable: false,
  },
];

async function qrWithLogo(text: string, size: number, logoSize: number): Promise<string> {
  const qrDataUrl = await QRCodeLib.toDataURL(text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "H", // High error correction to survive logo overlay
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });

  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 0, 0, size, size);

      // White square background for logo
      const cx = size / 2;
      const cy = size / 2;
      const pad = 6;
      const boxSize = logoSize + pad * 2;
      const radius = 4;
      ctx.beginPath();
      ctx.roundRect(cx - boxSize / 2, cy - boxSize / 2, boxSize, boxSize, radius);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#e5e5e5";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw logo
      const logoImg = new Image();
      logoImg.onload = () => {
        ctx.drawImage(logoImg, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
        resolve(canvas.toDataURL("image/png"));
      };
      logoImg.onerror = () => resolve(canvas.toDataURL("image/png")); // fallback without logo
      logoImg.src = "/images/logo.svg";
    };
    qrImg.src = qrDataUrl;
  });
}

function QRCanvas({ text, size = 200 }: { text: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    qrWithLogo(text, size, Math.round(size * 0.22)).then(setDataUrl).catch(() => {});
  }, [text, size]);

  if (!dataUrl) return <div className="w-48 h-48 bg-gray-100 rounded-lg animate-pulse" />;
  return <img src={dataUrl} alt="QR" className="w-48 h-48" />;
}

async function generateQRDataUrl(text: string, size: number = 1000): Promise<string> {
  return qrWithLogo(text, size, Math.round(size * 0.22));
}

export default function QRsPage() {
  const [qrs, setQrs] = useState<QRItem[]>(DEFAULT_QRS);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState(BASE_URL + "/");
  const [newDesc, setNewDesc] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newLabel.trim() || !newUrl.trim()) {
      toast.error("Nombre y URL son obligatorios");
      return;
    }
    setQrs((prev) => [...prev, {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      description: newDesc.trim(),
      url: newUrl.trim(),
      removable: true,
    }]);
    setNewLabel("");
    setNewUrl(BASE_URL + "/");
    setNewDesc("");
    setShowAdd(false);
    toast.success("QR creado");
  };

  const handleRemove = (id: string) => {
    setQrs((prev) => prev.filter((q) => q.id !== id));
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("URL copiada");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (qr: QRItem) => {
    try {
      const dataUrl = await generateQRDataUrl(qr.url, 1000);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `QR_${qr.label.replace(/\s+/g, "_")}.png`;
      a.click();
      toast.success("QR descargado");
    } catch {
      toast.error("Error al descargar");
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <QrCode className="w-5 h-5 text-oro" /> Códigos QR
          </h1>
          <p className="text-gray-500 text-xs mt-1">QRs para imprimir y compartir con tu público</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <><Trash2 className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Nuevo QR</>}
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-gray-900 font-bold text-sm">Crear QR personalizado</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">Nombre *</label>
              <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Ej: Evento Batallón" className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg focus:border-oro/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">URL *</label>
              <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://legionjuridica.com/..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg focus:border-oro/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-gray-500 text-xs font-medium mb-1 block">Descripción</label>
            <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Para qué se usa este QR..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg focus:border-oro/50 focus:outline-none" />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd}><Check className="w-4 h-4" /> Crear QR</Button>
          </div>
        </div>
      )}

      {/* QR Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {qrs.map((qr) => (
          <div key={qr.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden group">
            {/* QR Image */}
            <div className="bg-white p-6 flex items-center justify-center">
              <QRCanvas text={qr.url} />
            </div>

            {/* Info */}
            <div className="border-t border-gray-100 px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-bold text-sm">{qr.label}</h3>
                  {qr.description && <p className="text-gray-500 text-xs mt-0.5">{qr.description}</p>}
                </div>
                {qr.removable && (
                  <button onClick={() => handleRemove(qr.id)} className="text-gray-300 hover:text-red-500 p-1 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg px-3 py-1.5">
                <p className="text-gray-500 text-[10px] truncate">{qr.url}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyUrl(qr.id, qr.url)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border transition-colors ${
                    copiedId === qr.id
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {copiedId === qr.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedId === qr.id ? "Copiado" : "Copiar URL"}
                </button>
                <button
                  onClick={() => handleDownload(qr)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-oro/10 text-oro border border-oro/20 hover:bg-oro/20 transition-colors"
                >
                  <Download className="w-3 h-3" /> Descargar
                </button>
                <a
                  href={qr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-oro transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
