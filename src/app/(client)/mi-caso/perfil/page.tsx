"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClientStore } from "@/lib/stores/client-store";
import { MOCK_CASOS } from "@/lib/mock-data";
import { PIPELINES } from "@/lib/pipelines";
import { User, Shield, CreditCard, Scale, ArrowRight, Clock, Check, AlertTriangle, FileText } from "lucide-react";

const PAGO_CONFIG = {
  "Al dia": { color: "bg-green-100 text-green-700", icon: Check },
  "Pendiente": { color: "bg-yellow-100 text-yellow-700", icon: Clock },
  "Vencido": { color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

export default function ClientProfilePage() {
  const router = useRouter();
  const session = useClientStore((s) => s.session);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !session) router.replace("/mi-caso");
  }, [mounted, session, router]);

  if (!mounted || !session) return null;

  const casos = MOCK_CASOS.filter((c) => c.suscriptor_id === session.suscriptor_id);
  const casosActivos = casos.filter((c) => c.etapa !== "Cerrado");
  const casosCerrados = casos.filter((c) => c.etapa === "Cerrado");
  const pagoConfig = PAGO_CONFIG[session.estado_pago as keyof typeof PAGO_CONFIG] || PAGO_CONFIG["Al dia"];
  const PagoIcon = pagoConfig.icon;

  return (
    <div className="space-y-5">
      {/* Pending approval banner */}
      {session.estado_pago === "Pendiente" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center space-y-2">
          <Clock className="w-8 h-8 text-yellow-500 mx-auto" />
          <h2 className="text-yellow-800 font-bold text-base">Cuenta pendiente de aprobación</h2>
          <p className="text-yellow-600 text-sm">
            Tu contrato fue recibido. Un administrador debe aprobar tu cuenta antes de que puedas acceder a todos los servicios.
          </p>
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-jungle-dark/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-jungle-dark" />
          </div>
          <div className="min-w-0">
            <h1 className="text-gray-900 font-bold text-lg truncate">{session.nombre}</h1>
            <p className="text-gray-500 text-sm">{session.rango} • {session.rama}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] uppercase tracking-wider mb-1">
              <Shield className="w-3 h-3" /> Plan
            </div>
            <p className="text-gray-900 font-bold text-sm">Plan {session.plan}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] uppercase tracking-wider mb-1">
              <CreditCard className="w-3 h-3" /> Estado de pago
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${pagoConfig.color}`}>
              <PagoIcon className="w-3 h-3" /> {session.estado_pago}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider mb-0.5">Cédula</p>
            <p className="text-gray-900 font-medium">{session.cedula}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider mb-0.5">Teléfono</p>
            <p className="text-gray-900 font-medium">{session.telefono}</p>
          </div>
        </div>
      </div>

      {/* My contract link */}
      <Link
        href="/mi-caso/contrato"
        className="block bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:border-jungle-dark/30 transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-jungle-dark/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-jungle-dark" />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-sm">Mi Plan y Contrato</p>
              <p className="text-gray-500 text-xs">Plan {session.plan} — Ver y descargar</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300" />
        </div>
      </Link>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-jungle-dark">{casos.length}</p>
          <p className="text-gray-500 text-[10px]">Total casos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-oro">{casosActivos.length}</p>
          <p className="text-gray-500 text-[10px]">Activos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{casosCerrados.length}</p>
          <p className="text-gray-500 text-[10px]">Cerrados</p>
        </div>
      </div>

      {/* Cases preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 font-bold text-base flex items-center gap-2">
            <Scale className="w-4 h-4 text-gray-400" /> Mis Casos
          </h2>
          <Link href="/mi-caso/casos" className="text-jungle-dark text-xs font-medium flex items-center gap-1 hover:underline">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {casosActivos.slice(0, 3).map((caso) => {
            const pipeline = PIPELINES[caso.area];
            const progress = Math.round(((caso.etapa_index + 1) / pipeline.stages.length) * 100);
            return (
              <Link
                key={caso.id}
                href={`/mi-caso/casos/${caso.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-3.5 hover:border-jungle-dark/30 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 text-sm font-medium truncate pr-2">{caso.titulo}</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full">{caso.area}</span>
                  <span>•</span>
                  <span>{caso.abogado}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-oro rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{progress}%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Etapa: {caso.etapa}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
