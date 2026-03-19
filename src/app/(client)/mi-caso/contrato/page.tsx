"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useClientStore } from "@/lib/stores/client-store";
import { createClient } from "@/lib/supabase/client";
import ContractView from "@/components/contract/contract-view";
import type { ContractData } from "@/components/contract/contract-view";
import { FileText, Download, Printer } from "lucide-react";

interface ContratoRow {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  telefono2: string | null;
  email: string | null;
  estado_civil: string | null;
  grado: string | null;
  fuerza: string | null;
  unidad: string | null;
  direccion: string | null;
  ciudad: string | null;
  plan: string;
  precio: string;
  firma_data: string | null;
  foto_data: string | null;
  hash: string | null;
  created_at: string;
  datos_completos: {
    departamento?: string;
    cedula_frente?: string;
    cedula_reverso?: string;
  } | null;
}

export default function ClientContratoPage() {
  const router = useRouter();
  const session = useClientStore((s) => s.session);
  const [mounted, setMounted] = useState(false);
  const [contrato, setContrato] = useState<ContratoRow | null>(null);
  const [loading, setLoading] = useState(true);
  const contractRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !session) router.replace("/mi-caso");
  }, [mounted, session, router]);

  useEffect(() => {
    if (!session) return;
    const supabase = createClient();
    supabase
      .from("contratos")
      .select("*")
      .eq("cedula", session.cedula)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        setContrato(data as ContratoRow | null);
        setLoading(false);
      });
  }, [session]);

  if (!mounted || !session) return null;

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
        <FileText className="w-10 h-10 text-gray-300 mx-auto" />
        <h2 className="text-gray-900 font-bold text-base">Sin contrato</h2>
        <p className="text-gray-500 text-sm">No se encontró un contrato asociado a tu cuenta.</p>
      </div>
    );
  }

  const contractData: ContractData = {
    nombre: contrato.nombre,
    cedula: contrato.cedula,
    telefono: contrato.telefono,
    telefono2: contrato.telefono2 || "",
    email: contrato.email || "",
    estado_civil: contrato.estado_civil || "",
    grado: contrato.grado || "",
    fuerza: contrato.fuerza || "",
    unidad: contrato.unidad || "",
    direccion: contrato.direccion || "",
    ciudad: contrato.ciudad || "",
    departamento: contrato.datos_completos?.departamento || "",
    plan: contrato.plan,
    plan_precio: contrato.precio,
    firma_data: contrato.firma_data || undefined,
    foto_data: contrato.foto_data || undefined,
    cedula_frente: contrato.datos_completos?.cedula_frente || undefined,
    cedula_reverso: contrato.datos_completos?.cedula_reverso || undefined,
    hash: contrato.hash || undefined,
    fecha: new Date(contrato.created_at).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <h1 className="text-gray-900 font-bold text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" /> Mi Contrato
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
        </div>
      </div>

      {/* Plan summary */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center justify-between no-print">
        <div>
          <p className="text-gray-500 text-xs">Plan contratado</p>
          <p className="text-gray-900 font-bold text-base">Plan {contrato.plan}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs">Valor mensual</p>
          <p className="text-jungle-dark font-bold text-base">${contrato.precio}/mes</p>
        </div>
      </div>

      {/* Contract view */}
      <div ref={contractRef} className="print-contract bg-[#2a4a2a] rounded-2xl p-4">
        <ContractView data={contractData} readOnly />
      </div>

      {/* Print button bottom */}
      <div className="flex justify-center pb-4 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 text-sm text-white bg-jungle-dark hover:bg-jungle px-6 py-3 rounded-xl transition-colors font-medium"
        >
          <Download className="w-4 h-4" /> Descargar / Imprimir contrato
        </button>
      </div>
    </div>
  );
}