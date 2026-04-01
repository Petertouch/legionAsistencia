"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useTeamStore } from "@/lib/stores/team-store";
import { useLanzaStore } from "@/lib/stores/lanza-store";
import { Copy, ExternalLink, Users, TrendingUp, CircleDollarSign, Clock, Share2, BadgeDollarSign } from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "sonner";

export default function MiPanelVendedorPage() {
  const { user } = useAuth();
  const allMembers = useTeamStore((s) => s.abogados);
  const leads = useLanzaStore((s) => s.leads);
  const [copiedLink, setCopiedLink] = useState(false);

  const vendedor = useMemo(() => {
    if (!user) return null;
    return allMembers.find((m) => m.id === user.id && m.role === "vendedor") || null;
  }, [user, allMembers]);

  const stats = useMemo(() => {
    if (!vendedor) return null;
    const myLeads = leads.filter((l) => l.lanza_code === vendedor.vendedor_code);
    const convertidos = myLeads.filter((l) => l.status === "convertido");
    const nuevos = myLeads.filter((l) => l.status === "nuevo");
    const contactados = myLeads.filter((l) => l.status === "contactado");
    const perdidos = myLeads.filter((l) => l.status === "perdido");
    const comisionUnit = vendedor.comision_porcentaje > 0 ? vendedor.comision_porcentaje : 50000;
    const comisionTotal = convertidos.length * comisionUnit;
    const tasa = myLeads.length > 0 ? Math.round((convertidos.length / myLeads.length) * 100) : 0;
    return { myLeads, convertidos, nuevos, contactados, perdidos, comisionTotal, comisionUnit, tasa };
  }, [vendedor, leads]);

  if (!vendedor) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BadgeDollarSign className="w-12 h-12 text-beige/15 mb-3" />
        <p className="text-beige/40 text-sm">Cargando panel de vendedor...</p>
      </div>
    );
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://www.legionjuridica.com";
  const referralLink = `${siteUrl}/r/${vendedor.vendedor_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Link copiado al portapapeles");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Legión Jurídica — Tu escudo legal",
        text: "Asesoría jurídica ilimitada para Fuerzas Militares y Policía. Regístrate aquí:",
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  const statusColors: Record<string, string> = {
    nuevo: "bg-blue-500/15 text-blue-400",
    contactado: "bg-yellow-500/15 text-yellow-400",
    convertido: "bg-green-500/15 text-green-400",
    perdido: "bg-red-500/15 text-red-400",
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-white text-xl font-bold">Hola, {vendedor.nombre.split(" ")[0]}</h1>
        <p className="text-beige/40 text-sm mt-1">Tu panel de ventas y comisiones</p>
      </div>

      {/* Referral link — prominent */}
      <div className="bg-gradient-to-r from-oro/10 to-oro/5 border border-oro/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Share2 className="w-4 h-4 text-oro" />
          <p className="text-oro text-sm font-bold">Tu link de vendedor</p>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 bg-black/30 border border-white/10 text-oro text-sm px-4 py-3 rounded-lg truncate font-mono">{referralLink}</code>
          <Button size="sm" onClick={copyLink} className={copiedLink ? "bg-green-600 border-green-500" : ""}>
            <Copy className="w-4 h-4" /> {copiedLink ? "Copiado" : "Copiar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={shareLink}>
            <Share2 className="w-4 h-4" /> Compartir
          </Button>
        </div>
        <p className="text-beige/30 text-xs">Comparte este link por WhatsApp, redes sociales o en persona. Cada persona que se registre por tu link te genera <span className="text-oro font-bold">${(stats?.comisionUnit || 50000).toLocaleString()}</span> de comisión al cerrar.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Leads totales", value: stats?.myLeads.length || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Cierres", value: stats?.convertidos.length || 0, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Tasa conversión", value: `${stats?.tasa || 0}%`, icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Comisión ganada", value: `$${(stats?.comisionTotal || 0).toLocaleString()}`, icon: CircleDollarSign, color: "text-oro", bg: "bg-oro/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-white text-2xl font-bold">{stat.value}</p>
            <p className="text-beige/40 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Leads history */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white text-sm font-bold">Mis referidos ({stats?.myLeads.length || 0})</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-blue-400">{stats?.nuevos.length || 0} nuevos</span>
            <span className="text-yellow-400">{stats?.contactados.length || 0} en proceso</span>
            <span className="text-green-400">{stats?.convertidos.length || 0} cerrados</span>
          </div>
        </div>
        {(stats?.myLeads.length || 0) === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-beige/15 mx-auto mb-3" />
            <p className="text-beige/40 text-sm mb-1">Aún no tienes referidos</p>
            <p className="text-beige/25 text-xs">Comparte tu link para empezar a generar comisiones</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {stats?.myLeads.sort((a, b) => b.created_at.localeCompare(a.created_at)).map((lead) => (
              <div key={lead.id} className="px-4 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-beige/40 text-xs font-bold flex-shrink-0">
                  {lead.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{lead.nombre}</p>
                  <p className="text-beige/30 text-xs">{lead.telefono} · {lead.plan_interes || "Sin plan"}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[lead.status]}`}>
                  {lead.status}
                </span>
                {lead.status === "convertido" && (
                  <span className="text-oro text-xs font-bold">+${(stats.comisionUnit).toLocaleString()}</span>
                )}
                <span className="text-beige/20 text-[10px]">{new Date(lead.created_at).toLocaleDateString("es-CO")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
