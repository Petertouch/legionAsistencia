"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClientStore } from "@/lib/stores/client-store";
import { MOCK_CASOS } from "@/lib/mock-data";
import { PIPELINES } from "@/lib/pipelines";
import { Scale, ArrowRight, Check, MessageCircle } from "lucide-react";
import { useMessagesStore } from "@/lib/stores/messages-store";

const PRIORIDAD_COLOR = {
  urgente: "bg-red-100 text-red-700",
  alta: "bg-orange-100 text-orange-700",
  normal: "bg-blue-100 text-blue-700",
  baja: "bg-gray-100 text-gray-600",
};

export default function ClientCasosPage() {
  const router = useRouter();
  const session = useClientStore((s) => s.session);
  const messages = useMessagesStore((s) => s.messages);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !session) router.replace("/mi-caso");
  }, [mounted, session, router]);

  if (!mounted || !session) return null;

  const casos = MOCK_CASOS.filter((c) => c.suscriptor_id === session.suscriptor_id);
  const activos = casos.filter((c) => c.etapa !== "Cerrado");
  const cerrados = casos.filter((c) => c.etapa === "Cerrado");

  return (
    <div className="space-y-5">
      <h1 className="text-gray-900 font-bold text-lg flex items-center gap-2">
        <Scale className="w-5 h-5 text-gray-400" /> Mis Casos
      </h1>

      {/* Active */}
      {activos.length > 0 && (
        <div>
          <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Activos ({activos.length})</h2>
          <div className="space-y-2">
            {activos.map((caso) => {
              const pipeline = PIPELINES[caso.area];
              const progress = Math.round(((caso.etapa_index + 1) / pipeline.stages.length) * 100);
              const msgCount = messages.filter((m) => m.caso_id === caso.id).length;
              const prioColor = PRIORIDAD_COLOR[caso.prioridad as keyof typeof PRIORIDAD_COLOR] || PRIORIDAD_COLOR.normal;
              return (
                <Link
                  key={caso.id}
                  href={`/mi-caso/casos/${caso.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-jungle-dark/30 transition-colors active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-gray-900 text-sm font-semibold">{caso.titulo}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-full">{caso.area}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${prioColor}`}>{caso.prioridad}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2.5">
                    <span>👤 {caso.abogado}</span>
                    {msgCount > 0 && (
                      <span className="flex items-center gap-1 text-jungle-dark">
                        <MessageCircle className="w-3 h-3" /> {msgCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-oro rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold w-8 text-right">{progress}%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">Etapa actual: <strong className="text-gray-600">{caso.etapa}</strong></p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Closed */}
      {cerrados.length > 0 && (
        <div>
          <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Cerrados ({cerrados.length})</h2>
          <div className="space-y-2">
            {cerrados.map((caso) => (
              <Link
                key={caso.id}
                href={`/mi-caso/casos/${caso.id}`}
                className="block bg-gray-50 rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-700 text-sm font-medium">{caso.titulo}</p>
                    <p className="text-gray-400 text-xs">{caso.area} • {caso.abogado}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {casos.length === 0 && (
        <div className="text-center py-12">
          <Scale className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No tienes casos registrados</p>
        </div>
      )}
    </div>
  );
}
