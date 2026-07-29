"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, FileText, Clock, Inbox } from "lucide-react";

interface CasoNotif {
  id: string;
  titulo: string;
  cliente: string | null;
  area: string | null;
  etapa: string | null;
  fecha_limite: string | null;
}
interface NotifData {
  rol: string;
  total: number;
  nuevos_no_vistos?: { count: number; casos: CasoNotif[] };
  por_vencer?: { count: number; casos: CasoNotif[] };
  sin_asignar?: { count: number; casos: CasoNotif[] };
}

function vencimiento(iso: string | null): { txt: string; urgente: boolean } | null {
  if (!iso) return null;
  const dias = Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 3600 * 1000));
  if (dias < 0) return { txt: "Vencido", urgente: true };
  if (dias === 0) return { txt: "Vence hoy", urgente: true };
  if (dias === 1) return { txt: "Vence mañana", urgente: true };
  return { txt: `Vence en ${dias} días`, urgente: dias <= 2 };
}

function Item({ caso, tag }: { caso: CasoNotif; tag?: { txt: string; urgente: boolean } | null }) {
  return (
    <Link
      href={`/admin/casos/${caso.id}`}
      className="block px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
    >
      <p className="text-gray-900 text-sm font-medium truncate">{caso.titulo}</p>
      <div className="flex items-center gap-2 mt-0.5">
        {caso.cliente && <span className="text-gray-400 text-xs truncate">{caso.cliente}</span>}
        {caso.area && <span className="text-gray-300 text-xs">· {caso.area}</span>}
      </div>
      {tag && (
        <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
          tag.urgente ? "bg-red-50 text-red-600 border border-red-200" : "bg-amber-50 text-oro border border-amber-200"
        }`}>
          {tag.txt}
        </span>
      )}
    </Link>
  );
}

export default function NotifBell() {
  const [data, setData] = useState<NotifData | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notificaciones");
      if (res.ok) setData(await res.json());
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Rol sin notificaciones → no mostrar campana
  if (data && data.rol !== "admin" && data.rol !== "abogado") return null;

  const total = data?.total ?? 0;
  const nuevos = data?.nuevos_no_vistos?.casos ?? [];
  const porVencer = data?.por_vencer?.casos ?? [];
  const sinAsignar = data?.sin_asignar?.casos ?? [];
  const vacio = total === 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-gray-900 text-sm font-bold">Notificaciones</p>
            {total > 0 && <span className="text-gray-400 text-xs">{total} pendiente{total === 1 ? "" : "s"}</span>}
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {vacio && (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                <Inbox className="w-6 h-6 mx-auto mb-2 opacity-40" />
                Todo al día. Sin notificaciones.
              </div>
            )}

            {/* Admin: casos sin asignar */}
            {sinAsignar.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Casos sin asignar
                </p>
                {sinAsignar.map((c) => <Item key={c.id} caso={c} tag={vencimiento(c.fecha_limite)} />)}
              </>
            )}

            {/* Abogado: nuevos asignados */}
            {nuevos.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Nuevos casos asignados
                </p>
                {nuevos.map((c) => <Item key={c.id} caso={c} tag={vencimiento(c.fecha_limite)} />)}
              </>
            )}

            {/* Abogado: por vencer */}
            {porVencer.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Por vencer
                </p>
                {porVencer.map((c) => <Item key={c.id} caso={c} tag={vencimiento(c.fecha_limite)} />)}
              </>
            )}
          </div>

          <Link
            href="/admin/casos"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-oro text-xs font-medium hover:bg-gray-50 border-t border-gray-100"
          >
            Ver todos los casos
          </Link>
        </div>
      )}
    </div>
  );
}
