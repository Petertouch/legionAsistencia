"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanzaStore } from "@/lib/stores/lanza-store";
import { toast } from "sonner";
import { Copy, Users, Phone, DollarSign, Share2, LogOut } from "lucide-react";

const LEAD_STATUS_CONFIG = {
  nuevo: { label: "Nuevo", color: "bg-yellow-500/10 text-yellow-400" },
  contactado: { label: "Contactado", color: "bg-blue-500/10 text-blue-400" },
  convertido: { label: "Convertido", color: "bg-green-500/10 text-green-400" },
  perdido: { label: "Perdido", color: "bg-white/5 text-beige/40" },
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function LanzaPanelPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-oro/30 border-t-oro rounded-full animate-spin" /></div>}>
      <LanzaPanelContent />
    </Suspense>
  );
}

function LanzaPanelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") || "";
  const { getLanzaByCode, leads } = useLanzaStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const lanza = getLanzaByCode(code);
  if (!lanza) {
    return (
      <div className="min-h-screen bg-jungle-dark min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-beige/50 text-sm">Código de Lanza no válido</p>
          <button onClick={() => router.push("/lanzas")} className="text-oro text-sm hover:underline">
            Volver al portal
          </button>
        </div>
      </div>
    );
  }

  const misLeads = leads.filter((l) => l.lanza_id === lanza.id);
  const convertidos = misLeads.filter((l) => l.status === "convertido").length;
  const saldo = convertidos * 50000;
  const shareLink = `${window.location.origin}/r/${lanza.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copiado");
  };

  const handleShareWhatsApp = () => {
    const msg = `Necesitas un abogado para la Fuerza Pública? Legión Jurídica tiene planes desde $50.000/mes. Regístrate aquí: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-jungle-dark pt-24 pb-16 px-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Hola, {lanza.nombre.split(" ")[0]}</h1>
          <p className="text-beige/40 text-xs">Código: <span className="text-oro font-mono">{lanza.code}</span></p>
        </div>
        <button
          onClick={() => router.push("/lanzas")}
          className="text-beige/40 hover:text-red-400 p-2 transition-colors"
          title="Salir"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Share card */}
      <div className="bg-gradient-to-br from-jungle-dark to-jungle-dark/80 border border-oro/20 rounded-2xl p-5 space-y-3">
        <h2 className="text-oro font-bold text-sm flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Tu link de referido
        </h2>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-beige/70 text-xs truncate border border-white/10">
            {shareLink}
          </div>
          <button
            onClick={handleCopyLink}
            className="bg-oro/20 hover:bg-oro/30 text-oro px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium flex-shrink-0"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar
          </button>
        </div>
        <button
          onClick={handleShareWhatsApp}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.72-1.325A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.344 0-4.525-.659-6.39-1.803l-.446-.27-2.826.793.855-2.705-.298-.474A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
          Compartir por WhatsApp
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{misLeads.length}</p>
          <p className="text-beige/40 text-[10px]">Registrados</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{convertidos}</p>
          <p className="text-beige/40 text-[10px]">Convertidos</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-oro">{formatMoney(saldo)}</p>
          <p className="text-beige/40 text-[10px]">Ganado</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-bold text-sm mb-3">¿Cómo funciona?</h3>
        <div className="space-y-2.5">
          {[
            { step: "1", text: "Comparte tu link con amigos militares/policías" },
            { step: "2", text: "Ellos se registran con sus datos en tu landing" },
            { step: "3", text: "Nosotros los contactamos y los afiliamos" },
            { step: "4", text: "Tú ganas $50.000 por cada afiliado" },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-3">
              <span className="w-6 h-6 bg-oro/20 text-oro text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                {s.step}
              </span>
              <span className="text-beige/60 text-sm">{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leads list */}
      <div>
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-beige/40" /> Mis registrados ({misLeads.length})
        </h3>
        {misLeads.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <Users className="w-8 h-8 text-beige/20 mx-auto mb-2" />
            <p className="text-beige/40 text-sm">Aún no tienes registrados</p>
            <p className="text-beige/30 text-xs mt-1">Comparte tu link para empezar a ganar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {misLeads.map((lead) => {
              const config = LEAD_STATUS_CONFIG[lead.status];
              return (
                <div key={lead.id} className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white text-sm font-medium">{lead.nombre}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-beige/40">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {lead.telefono}
                    </span>
                    {lead.area_interes && <span>{lead.area_interes}</span>}
                    <span>
                      {new Date(lead.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {lead.status === "convertido" && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-green-400 font-medium">
                      <DollarSign className="w-3 h-3" /> +{formatMoney(50000)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
