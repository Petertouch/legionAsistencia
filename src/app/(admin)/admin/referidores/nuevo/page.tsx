"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReferidorStore, type ReferidorTipo } from "@/lib/stores/referidor-store";
import { getComisionesPorTipo, type ComisionesPorTipo } from "@/lib/config";
import Button from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Save, Shield, Heart, BadgeDollarSign, Users } from "lucide-react";
import { toast } from "sonner";

const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40";
const labelCls = "text-gray-500 text-xs font-medium mb-1.5 block";
const RAMAS = ["Ejército", "Policía", "Armada", "Fuerza Aérea", "Civil", "Otro"];

const TIPO_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  vendedor: { label: "Vendedor", icon: BadgeDollarSign, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  lanza: { label: "Lanza", icon: Shield, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  esposa: { label: "Esposa", icon: Heart, color: "text-pink-700", bg: "bg-pink-50 border-pink-200" },
};

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo] || { label: tipo, icon: Users, color: "text-gray-700", bg: "bg-gray-100 border-gray-200" };
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function NuevoReferidorPage() {
  const router = useRouter();
  const createReferidor = useReferidorStore((s) => s.createReferidor);
  const [comisiones, setComisiones] = useState<ComisionesPorTipo>({ lanza: 100000, esposa: 100000, vendedor: 50000 });

  useEffect(() => { getComisionesPorTipo().then(setComisiones); }, []);

  const [tipo, setTipo] = useState<ReferidorTipo>("vendedor");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cedula, setCedula] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [rama, setRama] = useState("Ejército");
  const [rango, setRango] = useState("");
  const [notas, setNotas] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !cedula.trim() || !telefono.trim()) {
      toast.error("Nombre, cédula y teléfono son requeridos");
      return;
    }
    const ref = await createReferidor({
      tipo,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      cedula: cedula.trim(),
      ciudad: ciudad.trim(),
      rama: tipo !== "vendedor" ? rama : "",
      rango: tipo !== "vendedor" ? rango.trim() : "",
      suscriptor_id: null,
      comision_personalizada: null,
      meta_bono: null,
      monto_bono: null,
      bono_pagado_at: null,
      color: null,
      notas: notas.trim() || null,
    });
    if (ref) {
      toast.success(`${getTipoConfig(tipo).label} "${nombre}" creado — código: ${ref.code}`);
      router.push("/admin/referidores");
    } else {
      toast.error("Error al crear");
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/referidores" className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-gray-900 text-xl font-bold">Nuevo aliado</h1>
          <p className="text-gray-400 text-sm mt-0.5">Se le asignará un código único para su link</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
        {/* Tipo selector */}
        <div>
          <label className={labelCls}>Tipo *</label>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(comisiones).map((t) => {
              const cfg = getTipoConfig(t);
              const Icon = cfg.icon;
              const active = tipo === t;
              return (
                <button key={t} type="button" onClick={() => setTipo(t)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    active ? `${cfg.bg} ${cfg.color} ring-2 ring-current/20` : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {cfg.label}
                  <span className="text-[10px] opacity-60">({formatMoney(comisiones[t] || 0)})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Nombre completo *</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} placeholder="Juan Pérez" required />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="juan@email.com" />
          </div>
          <div>
            <label className={labelCls}>Teléfono *</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))} className={inputCls} placeholder="3001234567" required />
          </div>
          <div>
            <label className={labelCls}>Cédula *</label>
            <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))} className={inputCls} placeholder="1234567890" required />
          </div>
          <div>
            <label className={labelCls}>Ciudad</label>
            <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} className={inputCls} placeholder="Bogotá" />
          </div>
          {tipo !== "vendedor" && (
            <>
              <div>
                <label className={labelCls}>Rama</label>
                <select value={rama} onChange={(e) => setRama(e.target.value)} className={`${inputCls} appearance-none`}>
                  {RAMAS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Rango / Cargo</label>
                <input type="text" value={rango} onChange={(e) => setRango(e.target.value)} className={inputCls} placeholder="Sargento" />
              </div>
            </>
          )}
          <div className="col-span-2">
            <label className={labelCls}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Notas internas..." />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit"><Save className="w-4 h-4" /> Crear {getTipoConfig(tipo).label.toLowerCase()}</Button>
        </div>
      </form>
    </div>
  );
}
