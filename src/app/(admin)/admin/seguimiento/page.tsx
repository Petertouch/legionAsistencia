"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSeguimientos, getCasos, createSeguimiento, getSuscriptores } from "@/lib/db";
import { useAuth } from "@/components/providers/auth-provider";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Link from "next/link";
import { Phone, MessageSquare, Calendar, StickyNote, ClipboardList, Plus, Send, X } from "lucide-react";
import { toast } from "sonner";

const TIPO_ICONS: Record<string, React.ReactNode> = {
  llamada: <Phone className="w-4 h-4" />, whatsapp: <MessageSquare className="w-4 h-4" />,
  reunion: <Calendar className="w-4 h-4" />, nota: <StickyNote className="w-4 h-4" />,
};

const TIPO_LABELS: Record<string, string> = {
  llamada: "Llamada", whatsapp: "WhatsApp", reunion: "Reunion", nota: "Nota",
};

const TIPO_OPTIONS = [
  { value: "nota", label: "Nota", icon: StickyNote },
  { value: "llamada", label: "Llamada", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "reunion", label: "Reunion", icon: Calendar },
] as const;

export default function SeguimientoPage() {
  const [tipoFilter, setTipoFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formTipo, setFormTipo] = useState<"nota" | "llamada" | "whatsapp" | "reunion">("nota");
  const [formDesc, setFormDesc] = useState("");
  const [formCasoId, setFormCasoId] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user, isAbogado } = useAuth();

  const abogadoFilter = isAbogado ? user?.nombre : undefined;

  // Get cases for the form dropdown and for filtering seguimientos
  const { data: casos } = useQuery({
    queryKey: ["casos", abogadoFilter],
    queryFn: () => getCasos(abogadoFilter ? { abogado: abogadoFilter } : undefined),
  });

  const { data: seguimientos, refetch } = useQuery({
    queryKey: ["seguimientos", tipoFilter],
    queryFn: () => getSeguimientos({ tipo: tipoFilter || undefined }),
  });

  // Filter seguimientos to only show ones related to this abogado's cases
  const filteredSeguimientos = isAbogado && casos
    ? seguimientos?.filter((s) => {
        if (s.caso_id) return casos.some((c) => c.id === s.caso_id);
        return false; // hide lead-only seguimientos for abogados
      })
    : seguimientos;

  const handleSubmit = async () => {
    if (!formDesc.trim()) return;
    setFormLoading(true);
    const caso = casos?.find((c) => c.id === formCasoId);
    await createSeguimiento({
      caso_id: formCasoId || null,
      suscriptor_id: caso?.suscriptor_id || null,
      lead_id: null,
      tipo: formTipo,
      descripcion: formDesc.trim(),
    });
    setFormDesc("");
    setFormCasoId("");
    setFormTipo("nota");
    setShowForm(false);
    setFormLoading(false);
    refetch();
    queryClient.invalidateQueries({ queryKey: ["seguimientos"] });
    toast.success("Actividad registrada");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-oro" />
          <span className="text-gray-500 text-sm">{filteredSeguimientos?.length || 0} actividades</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
            <option value="" className="bg-white">Todos los tipos</option>
            {["llamada", "reunion", "whatsapp", "nota"].map((t) => (
              <option key={t} value={t} className="bg-white">{TIPO_LABELS[t]}</option>
            ))}
          </select>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cerrar" : "Nueva actividad"}
          </Button>
        </div>
      </div>

      {/* New activity form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex gap-1.5">
            {TIPO_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => setFormTipo(value)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  formTipo === value ? "bg-amber-100 text-oro border border-oro/30" : "bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                }`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
          <select value={formCasoId} onChange={(e) => setFormCasoId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
            <option value="" className="bg-white">Sin caso asociado</option>
            {casos?.filter((c) => c.etapa !== "Cerrado").map((c) => (
              <option key={c.id} value={c.id} className="bg-white">{c.titulo} — {c.suscriptor_nombre}</option>
            ))}
          </select>
          <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe la actividad..."
            rows={2} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40 resize-none" />
          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={!formDesc.trim() || formLoading}
              className="flex items-center gap-1.5 bg-oro text-jungle-dark text-xs font-medium px-4 py-2 rounded-lg hover:bg-oro/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Send className="w-3.5 h-3.5" /> {formLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredSeguimientos?.map((seg) => (
          <div key={seg.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-4 hover:bg-white transition-colors">
            <div className="p-2.5 rounded-xl bg-gray-50 text-oro flex-shrink-0">
              {TIPO_ICONS[seg.tipo]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-600 text-sm">{seg.descripcion}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="neutral">{TIPO_LABELS[seg.tipo]}</Badge>
                {seg.suscriptor_nombre && (
                  <Link href={`/admin/suscriptores/${seg.suscriptor_id}`} className="text-oro text-xs hover:underline">
                    {seg.suscriptor_nombre}
                  </Link>
                )}
                {seg.lead_nombre && (
                  <Link href={`/admin/leads/${seg.lead_id}`} className="text-oro text-xs hover:underline">
                    {seg.lead_nombre}
                  </Link>
                )}
                {seg.caso_area && <Badge>{seg.caso_area}</Badge>}
                <span className="text-gray-400 text-xs ml-auto">
                  {new Date(seg.fecha).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
