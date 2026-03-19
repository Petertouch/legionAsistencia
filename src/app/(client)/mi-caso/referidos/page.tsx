"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClientStore } from "@/lib/stores/client-store";
import { useReferralStore } from "@/lib/stores/referral-store";
import { getComisionLanza } from "@/lib/config";
import { Gift, Copy, Check, Clock, Phone, User, DollarSign } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  contactado: { label: "Contactado", color: "bg-blue-100 text-blue-700", icon: Phone },
  cerrado: { label: "Cerrado", color: "bg-green-100 text-green-700", icon: Check },
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function ClientReferidosPage() {
  const router = useRouter();
  const session = useClientStore((s) => s.session);
  const referrals = useReferralStore((s) => s.referrals);
  const [mounted, setMounted] = useState(false);
  const [comision, setComision] = useState(50000);

  useEffect(() => { setMounted(true); getComisionLanza().then(setComision); }, []);
  useEffect(() => {
    if (mounted && !session) router.replace("/mi-caso");
  }, [mounted, session, router]);

  if (!mounted || !session) return null;

  const misReferidos = referrals.filter((r) => r.referrer_cedula === session.cedula);
  const cerrados = misReferidos.filter((r) => r.status === "cerrado");
  const saldo = cerrados.reduce((sum, r) => sum + r.deuda, 0);

  const referralCode = misReferidos[0]?.code;
  const shareLink = typeof window !== "undefined"
    ? `${window.location.origin}/r/${referralCode || "NUEVO"}`
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copiado al portapapeles");
  };

  const handleShareWhatsApp = () => {
    const msg = `¡Únete a Legión Jurídica! Asistencia legal para la Fuerza Pública. Afíliate aquí: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-gradient-to-br from-jungle-dark to-jungle-dark/90 rounded-2xl p-5 text-center space-y-3">
        <div className="w-12 h-12 bg-oro/20 rounded-full flex items-center justify-center mx-auto">
          <Gift className="w-6 h-6 text-oro" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">Programa de Referidos</h1>
          <p className="text-beige/50 text-sm mt-1">
            Gana <span className="text-oro font-bold">{formatMoney(comision)}</span> por cada amigo que se afilie
          </p>
        </div>

        {/* Share link */}
        <div className="bg-white/10 rounded-xl p-3 space-y-2">
          <p className="text-beige/40 text-[10px] uppercase tracking-wider">Tu link de referido</p>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-jungle-dark">{misReferidos.length}</p>
          <p className="text-gray-500 text-[10px]">Referidos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{cerrados.length}</p>
          <p className="text-gray-500 text-[10px]">Afiliados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-oro">{formatMoney(saldo)}</p>
          <p className="text-gray-500 text-[10px]">Saldo ganado</p>
        </div>
      </div>

      {/* Referrals list */}
      <div>
        <h2 className="text-gray-900 font-bold text-base mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" /> Mis Referidos
        </h2>
        {misReferidos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Gift className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aún no has referido a nadie</p>
            <p className="text-gray-400 text-xs mt-1">Comparte tu link y gana {formatMoney(comision)} por cada amigo que se afilie</p>
          </div>
        ) : (
          <div className="space-y-2">
            {misReferidos.map((r) => {
              const config = STATUS_CONFIG[r.status];
              const StatusIcon = config.icon;
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-900 text-sm font-medium">{r.referred_name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                      <StatusIcon className="w-3 h-3" /> {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {r.referred_phone}
                    </span>
                    <span>
                      {new Date(r.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {r.status === "cerrado" && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <DollarSign className="w-3 h-3" /> +{formatMoney(r.deuda)} ganados
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
