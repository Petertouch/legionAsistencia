"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { PIPELINES, AREAS, type CaseArea } from "@/lib/pipelines";
import { createCaso, getSuscriptores } from "@/lib/db";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

export default function NuevoCasoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState<CaseArea>("Disciplinario");

  const { data: suscriptores } = useQuery({ queryKey: ["suscriptores"], queryFn: () => getSuscriptores() });

  const pipeline = PIPELINES[selectedArea];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await createCaso({
      suscriptor_id: form.get("suscriptor_id") as string,
      area: selectedArea,
      titulo: form.get("titulo") as string,
      prioridad: form.get("prioridad") as "urgente" | "alta" | "normal" | "baja",
      abogado: form.get("abogado") as string,
      descripcion: form.get("descripcion") as string,
      fecha_limite: (form.get("fecha_limite") as string) || null,
    });
    queryClient.invalidateQueries({ queryKey: ["casos"] });
    queryClient.invalidateQueries({ queryKey: ["casos-pipeline"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    toast.success("Caso creado — asignado a etapa: " + pipeline.stages[0].name);
    router.push("/admin/casos");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/casos" className="text-gray-400 hover:text-gray-900 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <h2 className="text-gray-900 text-xl font-bold">Nuevo Caso</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-5">
        <Input label="Título del caso" name="titulo" placeholder="Descargos falta en servicio..." required />

        <Select
          label="Suscriptor (cliente)"
          name="suscriptor_id"
          placeholder="Seleccionar cliente..."
          options={suscriptores?.map((s) => ({ value: s.id, label: `${s.nombre} — ${s.rango}, ${s.rama}` })) || []}
          required
        />

        <Select
          label="Área legal"
          name="area"
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value as CaseArea)}
          options={AREAS.map((a) => ({ value: a, label: a }))}
        />

        {/* Pipeline preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-2">Pipeline: {pipeline.stages.length} etapas</p>
          <div className="flex flex-wrap gap-1.5">
            {pipeline.stages.map((stage, i) => (
              <div key={stage.name} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
                i === 0 ? "bg-amber-100 text-oro border border-oro/30" : "bg-gray-50 text-gray-400"
              }`}>
                {i === 0 && <Check className="w-3 h-3" />}
                {stage.name}
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-[10px] mt-2">El caso iniciara en &ldquo;{pipeline.stages[0].name}&rdquo;</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Prioridad" name="prioridad" options={[
            { value: "urgente", label: "Urgente" },
            { value: "alta", label: "Alta" },
            { value: "normal", label: "Normal" },
            { value: "baja", label: "Baja" },
          ]} />
          <Select label="Abogado asignado" name="abogado" placeholder="Seleccionar..." options={[
            { value: "Dr. Ramirez", label: "Dr. Ramirez" },
            { value: "Dra. Lopez", label: "Dra. Lopez" },
            { value: "Dr. Martinez", label: "Dr. Martinez" },
          ]} required />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-600">Descripción</label>
          <textarea name="descripcion" rows={4} placeholder="Describa el caso..." required
            className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-oro/50 focus:ring-1 focus:ring-oro/20 transition-colors resize-none" />
        </div>

        <Input label="Fecha limite (deadline)" name="fecha_limite" type="date" />

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/casos"><Button type="button" variant="ghost">Cancelar</Button></Link>
          <Button type="submit" disabled={loading}>{loading ? "Creando..." : "Crear Caso"}</Button>
        </div>
      </form>
    </div>
  );
}
