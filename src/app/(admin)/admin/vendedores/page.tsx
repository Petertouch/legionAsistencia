"use client";

import { useMemo, useState } from "react";
import { useTeamStore } from "@/lib/stores/team-store";
import { useLanzaStore } from "@/lib/stores/lanza-store";
import { useVendedorConfigStore } from "@/lib/stores/vendedor-config-store";
import type { ComisionTipo, PagoFrecuencia } from "@/lib/stores/vendedor-config-store";
import Link from "next/link";
import {
  Plus, BadgeDollarSign, Users, TrendingUp, CircleDollarSign,
  Settings, X, Save, RotateCcw, DollarSign, Target, Calendar, Link2, MessageSquare,
} from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "sonner";

const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40";
const labelCls = "text-gray-500 text-xs font-medium mb-1.5 block";

export default function VendedoresPage() {
  const allMembers = useTeamStore((s) => s.abogados);
  const vendedores = useMemo(() => allMembers.filter((m) => m.role === "vendedor"), [allMembers]);
  const leads = useLanzaStore((s) => s.leads);
  const config = useVendedorConfigStore((s) => s.config);
  const updateConfig = useVendedorConfigStore((s) => s.updateConfig);
  const resetConfig = useVendedorConfigStore((s) => s.resetConfig);
  const [showSettings, setShowSettings] = useState(false);

  // Calculate stats per vendedor using global config
  const vendedorStats = useMemo(() => {
    return vendedores.map((v) => {
      const myLeads = leads.filter((l) => l.lanza_code === v.vendedor_code);
      const convertidos = myLeads.filter((l) => l.status === "convertido").length;
      const nuevos = myLeads.filter((l) => l.status === "nuevo").length;
      const contactados = myLeads.filter((l) => l.status === "contactado").length;
      const perdidos = myLeads.filter((l) => l.status === "perdido").length;
      const total = myLeads.length;
      // Use individual override if set, otherwise global config
      const comisionUnit = v.comision_porcentaje > 0
        ? v.comision_porcentaje
        : config.comision_tipo === "fijo" ? config.comision_fija : config.comision_fija; // TODO: calculate % from plan price
      const comisionTotal = convertidos * comisionUnit;
      const tasa = total > 0 ? Math.round((convertidos / total) * 100) : 0;
      // Bonus
      const cumplioMeta = config.bonificacion_activa && convertidos >= config.bonificacion_meta;
      const bonus = cumplioMeta ? config.bonificacion_monto : 0;
      return { ...v, myLeads, convertidos, nuevos, contactados, perdidos, total, comisionTotal: comisionTotal + bonus, comisionUnit, tasa, cumplioMeta };
    });
  }, [vendedores, leads, config]);

  // Totals
  const totalVendedores = vendedores.length;
  const totalLeads = vendedorStats.reduce((s, v) => s + v.total, 0);
  const totalConvertidos = vendedorStats.reduce((s, v) => s + v.convertidos, 0);
  const totalComision = vendedorStats.reduce((s, v) => s + v.comisionTotal, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold">Vendedores</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona tu equipo comercial y sus comisiones</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-lg border transition-colors ${
              showSettings
                ? "bg-amber-50 border-oro/30 text-oro"
                : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-200"
            }`}
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>
          <Link href="/admin/vendedores/nuevo">
            <Button size="sm"><Plus className="w-4 h-4" /> Nuevo vendedor</Button>
          </Link>
        </div>
      </div>

      {/* ═══ SETTINGS PANEL ═══ */}
      {showSettings && (
        <div className="bg-gray-50 border border-oro/20 rounded-xl overflow-hidden">
          {/* Settings header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-oro/5">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-oro" />
              <span className="text-gray-900 text-sm font-bold">Configuración de ventas</span>
            </div>
            <button onClick={() => setShowSettings(false)} className="p-1 text-gray-400 hover:text-gray-900 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* ── Section: Comisiones ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-green-600" />
                <h3 className="text-gray-900 text-sm font-bold">Comisiones</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Tipo de comisión</label>
                  <select
                    value={config.comision_tipo}
                    onChange={(e) => updateConfig({ comision_tipo: e.target.value as ComisionTipo })}
                    className={`${inputCls} appearance-none`}
                  >
                    <option value="fijo" className="bg-white">Monto fijo por cierre</option>
                    <option value="porcentaje" className="bg-white">% del valor del plan</option>
                  </select>
                </div>
                {config.comision_tipo === "fijo" ? (
                  <div>
                    <label className={labelCls}>Monto por cierre (COP)</label>
                    <input
                      type="number"
                      value={config.comision_fija}
                      onChange={(e) => updateConfig({ comision_fija: parseInt(e.target.value) || 0 })}
                      className={inputCls}
                      min="0"
                      step="5000"
                    />
                    <p className="text-gray-300 text-[10px] mt-1">Cada cierre le paga ${config.comision_fija.toLocaleString()} al vendedor</p>
                  </div>
                ) : (
                  <div>
                    <label className={labelCls}>Porcentaje de comisión (%)</label>
                    <input
                      type="number"
                      value={config.comision_porcentaje}
                      onChange={(e) => updateConfig({ comision_porcentaje: parseInt(e.target.value) || 0 })}
                      className={inputCls}
                      min="0"
                      max="100"
                    />
                    <p className="text-gray-300 text-[10px] mt-1">Se calcula sobre el primer pago del cliente</p>
                  </div>
                )}
                <div>
                  <label className={labelCls}>Frecuencia de pago</label>
                  <select
                    value={config.pago_frecuencia}
                    onChange={(e) => updateConfig({ pago_frecuencia: e.target.value as PagoFrecuencia })}
                    className={`${inputCls} appearance-none`}
                  >
                    <option value="quincenal" className="bg-white">Quincenal</option>
                    <option value="mensual" className="bg-white">Mensual</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Section: Metas y Bonificaciones ── */}
            <div className="border-t border-gray-200 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-purple-600" />
                <h3 className="text-gray-900 text-sm font-bold">Metas y bonificaciones</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Meta mensual (cierres)</label>
                  <input
                    type="number"
                    value={config.meta_mensual}
                    onChange={(e) => updateConfig({ meta_mensual: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                    min="0"
                  />
                  <p className="text-gray-300 text-[10px] mt-1">Cierres esperados por vendedor al mes</p>
                </div>
                <div>
                  <label className={labelCls}>
                    <span className="flex items-center gap-2">
                      Bonificación por meta
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.bonificacion_activa}
                          onChange={(e) => updateConfig({ bonificacion_activa: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-100 peer-checked:bg-green-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-beige/40 peer-checked:after:bg-green-400 after:rounded-full after:h-3 after:w-3 after:transition-all" />
                      </label>
                    </span>
                  </label>
                  <input
                    type="number"
                    value={config.bonificacion_meta}
                    onChange={(e) => updateConfig({ bonificacion_meta: parseInt(e.target.value) || 0 })}
                    className={`${inputCls} ${!config.bonificacion_activa ? "opacity-40" : ""}`}
                    min="0"
                    disabled={!config.bonificacion_activa}
                    placeholder="Cierres para bono"
                  />
                  <p className="text-gray-300 text-[10px] mt-1">Al llegar a {config.bonificacion_meta} cierres</p>
                </div>
                <div>
                  <label className={labelCls}>Monto del bono (COP)</label>
                  <input
                    type="number"
                    value={config.bonificacion_monto}
                    onChange={(e) => updateConfig({ bonificacion_monto: parseInt(e.target.value) || 0 })}
                    className={`${inputCls} ${!config.bonificacion_activa ? "opacity-40" : ""}`}
                    min="0"
                    step="10000"
                    disabled={!config.bonificacion_activa}
                  />
                  <p className="text-gray-300 text-[10px] mt-1">Bono extra: ${config.bonificacion_monto.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* ── Section: Reglas ── */}
            <div className="border-t border-gray-200 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-gray-900 text-sm font-bold">Reglas de cierre</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Días máximos para cerrar</label>
                  <input
                    type="number"
                    value={config.dias_para_cerrar}
                    onChange={(e) => updateConfig({ dias_para_cerrar: parseInt(e.target.value) || 30 })}
                    className={inputCls}
                    min="1"
                  />
                  <p className="text-gray-300 text-[10px] mt-1">Después de {config.dias_para_cerrar} días el lead no cuenta como cierre del vendedor</p>
                </div>
                <div>
                  <label className={labelCls}>
                    <span className="flex items-center gap-2">
                      Requiere suscriptor activo para comisión
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.requiere_suscriptor_activo}
                          onChange={(e) => updateConfig({ requiere_suscriptor_activo: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-100 peer-checked:bg-green-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-beige/40 peer-checked:after:bg-green-400 after:rounded-full after:h-3 after:w-3 after:transition-all" />
                      </label>
                    </span>
                  </label>
                  <p className="text-gray-300 text-[10px] mt-2">
                    {config.requiere_suscriptor_activo
                      ? "El cliente debe estar activo y al día para pagar la comisión"
                      : "La comisión se paga cuando el lead se marca como convertido"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section: Links y mensajes ── */}
            <div className="border-t border-gray-200 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-oro" />
                <h3 className="text-gray-900 text-sm font-bold">Links y mensajes</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>URL base para links de referido</label>
                  <input
                    type="text"
                    value={config.url_base}
                    onChange={(e) => updateConfig({ url_base: e.target.value })}
                    className={inputCls}
                    placeholder="https://www.legionjuridica.com"
                  />
                  <p className="text-gray-300 text-[10px] mt-1">El link será: {config.url_base}/r/CODIGO</p>
                </div>
                <div>
                  <label className={labelCls}>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" />
                      Mensaje predeterminado de WhatsApp
                    </span>
                  </label>
                  <textarea
                    value={config.mensaje_whatsapp}
                    onChange={(e) => updateConfig({ mensaje_whatsapp: e.target.value })}
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Mensaje que se copia al compartir el link..."
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <button
                onClick={() => { resetConfig(); toast.success("Configuración restaurada"); }}
                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar valores por defecto
              </button>
              <Button size="sm" onClick={() => { setShowSettings(false); toast.success("Configuración guardada"); }}>
                <Save className="w-4 h-4" /> Guardar configuración
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Vendedores", value: totalVendedores, icon: BadgeDollarSign, color: "text-purple-600" },
          { label: "Leads totales", value: totalLeads, icon: Users, color: "text-blue-600" },
          { label: "Cierres", value: totalConvertidos, icon: TrendingUp, color: "text-green-600" },
          { label: "Comisiones", value: `$${totalComision.toLocaleString()}`, icon: CircleDollarSign, color: "text-oro" },
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

      {/* Config summary bar */}
      <div className="flex items-center gap-4 text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2">
        <span>Comisión: <span className="text-oro">{config.comision_tipo === "fijo" ? `$${config.comision_fija.toLocaleString()}/cierre` : `${config.comision_porcentaje}%`}</span></span>
        <span className="text-gray-900/10">|</span>
        <span>Meta: <span className="text-purple-600">{config.meta_mensual} cierres/mes</span></span>
        <span className="text-gray-900/10">|</span>
        <span>Pago: <span className="text-blue-600">{config.pago_frecuencia}</span></span>
        {config.bonificacion_activa && (
          <>
            <span className="text-gray-900/10">|</span>
            <span>Bono: <span className="text-green-600">${config.bonificacion_monto.toLocaleString()} al llegar a {config.bonificacion_meta}</span></span>
          </>
        )}
        <button onClick={() => setShowSettings(true)} className="ml-auto text-oro hover:underline">Editar</button>
      </div>

      {/* Vendedores table */}
      {vendedores.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <BadgeDollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-4">No hay vendedores registrados</p>
          <Link href="/admin/vendedores/nuevo">
            <Button size="sm"><Plus className="w-4 h-4" /> Crear primer vendedor</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-gray-400 text-xs font-medium px-4 py-3">Vendedor</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-4 py-3">Código</th>
                  <th className="text-center text-gray-400 text-xs font-medium px-4 py-3">Leads</th>
                  <th className="text-center text-gray-400 text-xs font-medium px-4 py-3">Nuevos</th>
                  <th className="text-center text-gray-400 text-xs font-medium px-4 py-3">Cierres</th>
                  <th className="text-center text-gray-400 text-xs font-medium px-4 py-3">Meta</th>
                  <th className="text-center text-gray-400 text-xs font-medium px-4 py-3">Tasa</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-4 py-3">Comisión</th>
                  <th className="text-center text-gray-400 text-xs font-medium px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {vendedorStats.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/vendedores/${v.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-900 font-bold text-xs" style={{ backgroundColor: v.color }}>
                          {v.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className="text-gray-900 text-sm font-medium group-hover:text-oro transition-colors">{v.nombre}</p>
                          <p className="text-gray-400 text-xs">{v.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-oro text-xs bg-amber-50 px-2 py-0.5 rounded">{v.vendedor_code || "—"}</code>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{v.total}</td>
                    <td className="px-4 py-3 text-center">
                      {v.nuevos > 0 ? (
                        <span className="text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full text-xs font-medium">{v.nuevos}</span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {v.convertidos > 0 ? (
                        <span className="text-green-600 font-bold">{v.convertidos}</span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              v.convertidos >= config.meta_mensual ? "bg-green-400" : v.convertidos >= config.meta_mensual * 0.5 ? "bg-oro" : "bg-gray-100"
                            }`}
                            style={{ width: `${Math.min((v.convertidos / Math.max(config.meta_mensual, 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-[10px]">{v.convertidos}/{config.meta_mensual}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${v.tasa >= 30 ? "text-green-600" : v.tasa >= 15 ? "text-oro" : "text-gray-400"}`}>
                        {v.tasa}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-oro font-bold text-sm">${v.comisionTotal.toLocaleString()}</span>
                      {v.cumplioMeta && <span className="text-green-600 text-[9px] block">+bono</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.estado === "activo" ? "bg-green-50 text-green-600" : "bg-red-100 text-red-600"
                      }`}>
                        {v.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
