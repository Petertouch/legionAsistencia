"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClientStore } from "@/lib/stores/client-store";
import { createCaso } from "@/lib/db";
import { AREAS, type CaseArea } from "@/lib/pipelines";
import { ArrowLeft, Scale, Send } from "lucide-react";
import { toast } from "sonner";

// Áreas que el cliente puede solicitar (se excluye "Consulta", que es el flujo del blog).
const AREAS_CLIENTE = AREAS.filter((a) => a !== "Consulta");

export default function ClientNuevoCasoPage() {
  const router = useRouter();
  const session = useClientStore((s) => s.session);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [area, setArea] = useState<CaseArea>("Disciplinario");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !session) router.replace("/mi-caso");
  }, [mounted, session, router]);

  if (!mounted || !session) return null;

  const canSave = titulo.trim().length >= 3 && descripcion.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || loading) return;
    setLoading(true);
    try {
      await createCaso({
        suscriptor_id: session.suscriptor_id,
        area,
        titulo: titulo.trim(),
        prioridad: "normal",
        descripcion: descripcion.trim(),
        fecha_limite: null,
      });
      toast.success("Caso creado. Un abogado será asignado pronto.");
      router.push("/mi-caso/casos");
    } catch {
      toast.error("No se pudo crear el caso. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3.5 py-2.5 rounded-xl placeholder-gray-400 focus:outline-none focus:border-jungle-dark/40 transition-colors";

  return (
    <div className="space-y-5">
      <Link href="/mi-caso/casos" className="inline-flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mis Casos
      </Link>

      <h1 className="text-gray-900 font-bold text-lg flex items-center gap-2">
        <Scale className="w-5 h-5 text-gray-400" /> Nuevo caso
      </h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-gray-600 text-xs font-medium mb-1.5 block">Área legal</label>
          <select value={area} onChange={(e) => setArea(e.target.value as CaseArea)} className={`${inputCls} appearance-none`}>
            {AREAS_CLIENTE.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label className="text-gray-600 text-xs font-medium mb-1.5 block">Título del caso</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Notificación de investigación disciplinaria"
            className={inputCls}
            maxLength={120}
          />
        </div>

        <div>
          <label className="text-gray-600 text-xs font-medium mb-1.5 block">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={5}
            placeholder="Describe tu situación con el mayor detalle posible..."
            className={`${inputCls} resize-none`}
          />
          <p className="text-gray-400 text-[11px] mt-1">
            {descripcion.trim().length < 10 ? "Mínimo 10 caracteres" : `${descripcion.trim().length} caracteres`}
          </p>
        </div>

        <button
          type="submit"
          disabled={!canSave || loading}
          className="w-full flex items-center justify-center gap-2 bg-oro hover:bg-oro/90 text-jungle-dark font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" /> {loading ? "Creando..." : "Crear caso"}
        </button>
        <p className="text-gray-400 text-[11px] text-center">
          Se asignará un abogado a tu caso y podrás seguir su avance aquí.
        </p>
      </form>
    </div>
  );
}
