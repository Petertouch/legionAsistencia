"use client";

import { useState } from "react";
import { getSuscriptor, getCasosBySuscriptor } from "@/lib/db";
import type { PlanConfig } from "@/components/contract/plan-editor";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { Gem, Check, Loader2 } from "lucide-react";

const norm = (s?: string | null) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

interface Data {
  plan_nombre: string;
  estado: string;
  plan: PlanConfig | null;
  benef: number;
  consultasMes: number;
  total: number;
}

export default function PlanConsumo({ suscriptorId }: { suscriptorId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [d, setD] = useState<Data | null>(null);

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (d) return;
    setLoading(true);
    try {
      const [sus, planesRaw, benefRaw, casos] = await Promise.all([
        getSuscriptor(suscriptorId),
        fetch("/api/config/planes").then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/client/beneficiarios?suscriptor_id=${suscriptorId}`).then((r) => (r.ok ? r.json() : [])),
        getCasosBySuscriptor(suscriptorId),
      ]);
      const planes = (Array.isArray(planesRaw) ? planesRaw : []) as PlanConfig[];
      const plan = planes.find((p) => norm(p.nombre) === norm(sus?.plan)) || null;
      const now = new Date();
      const consultasMes = (casos || []).filter((c) => {
        const x = new Date(c.created_at);
        return x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear();
      }).length;
      setD({
        plan_nombre: sus?.plan || "—",
        estado: sus?.estado_pago || "",
        plan,
        benef: Array.isArray(benefRaw) ? benefRaw.length : 0,
        consultasMes,
        total: (casos || []).length,
      });
    } catch { setD(null); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" onClick={toggle}>
        <Gem className="w-4 h-4" /> <span className="hidden sm:inline">Plan</span>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 md:right-0 md:left-auto top-full mt-2 w-[calc(100vw-2rem)] max-w-xs bg-white border border-gray-200 rounded-xl p-4 shadow-xl z-50 space-y-3">
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-oro animate-spin" /></div>
            ) : !d ? (
              <p className="text-gray-400 text-sm">No se pudo cargar el plan.</p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-gray-900 font-bold text-sm flex items-center gap-1.5"><Gem className="w-4 h-4 text-oro" /> Plan {d.plan_nombre}</h3>
                  {d.estado && <Badge size="xs" variant={norm(d.estado) === "al dia" ? "success" : "warning"}>{d.estado}</Badge>}
                </div>

                {d.plan ? (
                  <>
                    {d.plan.precio && <p className="text-oro font-bold text-lg leading-none">${d.plan.precio}<span className="text-gray-400 text-xs font-normal"> /mes</span></p>}
                    <div className="space-y-2">
                      <ConsumoRow label="Consultas este mes" used={d.consultasMes} total={d.plan.consultas} />
                      <ConsumoRow label="Familiares registrados" used={d.benef} total={d.plan.familiares} />
                    </div>
                    {d.plan.caracteristicas?.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-gray-400 text-[10px] mb-1">Incluye</p>
                        <ul className="space-y-1">
                          {d.plan.caracteristicas.map((c, i) => (
                            <li key={i} className="text-gray-600 text-xs flex items-start gap-1.5"><Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-gray-400 text-xs">Este plan no está configurado en Configuración.</p>
                    <p className="text-gray-600 text-xs">Consultas este mes: <strong className="text-gray-900">{d.consultasMes}</strong></p>
                    <p className="text-gray-600 text-xs">Familiares registrados: <strong className="text-gray-900">{d.benef}</strong></p>
                  </div>
                )}
                <p className="text-gray-400 text-[10px] pt-1.5 border-t border-gray-100">Total de casos del cliente: {d.total}</p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ConsumoRow({ label, used, total }: { label: string; used: number; total?: number }) {
  const has = typeof total === "number" && total > 0;
  const pct = has ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const over = has && used > total;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={over ? "text-red-600 font-bold" : "text-gray-900 font-medium"}>{used}{has ? ` / ${total}` : ""}</span>
      </div>
      {has && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: over ? "#ef4444" : pct > 80 ? "#eab308" : "#22c55e" }} />
        </div>
      )}
    </div>
  );
}
