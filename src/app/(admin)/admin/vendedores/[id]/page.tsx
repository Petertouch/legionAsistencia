"use client";

import { use, useMemo } from "react";
import { useTeamStore } from "@/lib/stores/team-store";
import { useLanzaStore } from "@/lib/stores/lanza-store";
import Link from "next/link";
import { ArrowLeft, Copy, ExternalLink, Users, TrendingUp, CircleDollarSign, Clock } from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "sonner";

export default function VendedorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const getMember = useTeamStore((s) => s.getMember);
  const vendedor = getMember(id);
  const leads = useLanzaStore((s) => s.leads);
  const updateLeadStatus = useLanzaStore((s) => s.updateLeadStatus);

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
        <p className="text-gray-400 text-sm">Vendedor no encontrado</p>
        <Link href="/admin/vendedores" className="text-oro text-sm mt-2 hover:underline">Volver</Link>
      </div>
    );
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://www.legionjuridica.com";
  const referralLink = `${siteUrl}/r/${vendedor.vendedor_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copiado");
  };

  const statusColors: Record<string, string> = {
    nuevo: "bg-blue-50 text-blue-600",
    contactado: "bg-yellow-50 text-yellow-600",
    convertido: "bg-green-50 text-green-600",
    perdido: "bg-red-100 text-red-600",
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/vendedores" className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-gray-900 font-bold text-lg" style={{ backgroundColor: vendedor.color }}>
            {vendedor.nombre.charAt(0)}
          </div>
          <div>
            <h1 className="text-gray-900 text-xl font-bold">{vendedor.nombre}</h1>
            <p className="text-gray-400 text-sm">{vendedor.email} · {vendedor.ciudad || "Sin ciudad"}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
          vendedor.estado === "activo" ? "bg-green-50 text-green-600" : "bg-red-100 text-red-600"
        }`}>
          {vendedor.estado}
        </span>
      </div>

      {/* Referral link */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-gray-400 text-xs font-medium mb-2">Link de referido del vendedor</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-black/30 border border-gray-200 text-oro text-sm px-4 py-2.5 rounded-lg truncate">{referralLink}</code>
          <Button size="sm" variant="ghost" onClick={copyLink}><Copy className="w-4 h-4" /> Copiar</Button>
          <a href={referralLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost"><ExternalLink className="w-4 h-4" /></Button>
          </a>
        </div>
        <p className="text-gray-300 text-[10px] mt-2">Código: <code className="text-oro">{vendedor.vendedor_code}</code> · Comisión por cierre: <span className="text-oro font-bold">${(stats?.comisionUnit || 50000).toLocaleString()}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Leads totales", value: stats?.myLeads.length || 0, icon: Users, color: "text-blue-600" },
          { label: "Cierres", value: stats?.convertidos.length || 0, icon: TrendingUp, color: "text-green-600" },
          { label: "Tasa conversión", value: `${stats?.tasa || 0}%`, icon: Clock, color: "text-purple-600" },
          { label: "Comisión total", value: `$${(stats?.comisionTotal || 0).toLocaleString()}`, icon: CircleDollarSign, color: "text-oro" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-gray-400 text-xs">{stat.label}</span>
            </div>
            <p className="text-gray-900 text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Leads table */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-gray-900 text-sm font-bold">Leads del vendedor ({stats?.myLeads.length || 0})</h2>
        </div>
        {(stats?.myLeads.length || 0) === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Sin leads aún</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-gray-400 text-xs font-medium px-4 py-2.5">Cliente</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-4 py-2.5">Teléfono</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-4 py-2.5">Plan</th>
                  <th className="text-center text-gray-400 text-xs font-medium px-4 py-2.5">Estado</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-4 py-2.5">Fecha</th>
                  <th className="text-center text-gray-400 text-xs font-medium px-4 py-2.5">Acción</th>
                </tr>
              </thead>
              <tbody>
                {stats?.myLeads.sort((a, b) => b.created_at.localeCompare(a.created_at)).map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="text-gray-900 text-sm">{lead.nombre}</p>
                      <p className="text-gray-400 text-xs">{lead.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{lead.telefono}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{lead.plan_interes || "—"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{new Date(lead.created_at).toLocaleDateString("es-CO")}</td>
                    <td className="px-4 py-2.5 text-center">
                      {lead.status !== "convertido" && lead.status !== "perdido" && (
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={() => updateLeadStatus(lead.id, "contactado")}
                            className="text-[10px] text-yellow-600 hover:underline"
                          >
                            Contactado
                          </button>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={() => { updateLeadStatus(lead.id, "convertido"); toast.success("Cierre registrado"); }}
                            className="text-[10px] text-green-600 hover:underline font-bold"
                          >
                            Cerrado
                          </button>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={() => updateLeadStatus(lead.id, "perdido")}
                            className="text-[10px] text-red-600/60 hover:underline"
                          >
                            Perdido
                          </button>
                        </div>
                      )}
                      {lead.status === "convertido" && <span className="text-green-600 text-xs">Cerrado</span>}
                      {lead.status === "perdido" && <span className="text-red-600/60 text-xs">Perdido</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
