"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { PIPELINES, AREAS, type CaseArea } from "@/lib/pipelines";
import { createCaso, getSuscriptores } from "@/lib/db";
import type { Suscriptor } from "@/lib/mock-data";
import { ArrowLeft, Check, Search, X, User } from "lucide-react";
import { toast } from "sonner";

export default function NuevoCasoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState<CaseArea>("Disciplinario");

  // Suscriptor search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Suscriptor[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedSuscriptor, setSelectedSuscriptor] = useState<Suscriptor | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await getSuscriptores({ search: searchQuery.trim() });
        setSearchResults(results);
        setShowResults(true);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleSelectSuscriptor = (s: Suscriptor) => {
    setSelectedSuscriptor(s);
    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);
  };

  const pipeline = PIPELINES[selectedArea];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSuscriptor) {
      toast.error("Selecciona un suscriptor");
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await createCaso({
      suscriptor_id: selectedSuscriptor.id,
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
        {/* Suscriptor search */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Suscriptor (cliente) *</label>

          {selectedSuscriptor ? (
            <div className="bg-white border border-oro/30 rounded-lg p-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-oro/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-oro" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium text-sm">{selectedSuscriptor.nombre}</p>
                  <div className="flex items-center gap-3 text-gray-500 text-xs mt-0.5">
                    <span>CC {selectedSuscriptor.cedula}</span>
                    {selectedSuscriptor.rama && <span>{selectedSuscriptor.rama}</span>}
                    {selectedSuscriptor.rango && <span>{selectedSuscriptor.rango}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 text-xs mt-0.5">
                    <span>{selectedSuscriptor.email}</span>
                    <span>{selectedSuscriptor.telefono}</span>
                    <span className="text-oro font-medium">Plan {selectedSuscriptor.plan}</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedSuscriptor(null)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o cédula..."
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm pl-10 pr-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/50 focus:ring-1 focus:ring-oro/20 transition-colors"
                  autoComplete="off"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-oro rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {showResults && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No se encontraron resultados</p>
                  ) : (
                    searchResults.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSuscriptor(s)}
                        className="w-full text-left px-4 py-2.5 hover:bg-amber-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 text-sm font-medium">{s.nombre}</p>
                            <p className="text-gray-500 text-xs">CC {s.cedula} {s.rama ? `· ${s.rama}` : ""} {s.rango ? `· ${s.rango}` : ""}</p>
                          </div>
                          <span className="text-oro text-[10px] font-bold bg-amber-50 px-2 py-0.5 rounded-full">{s.plan}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <Input label="Título del caso" name="titulo" placeholder="Descargos falta en servicio..." required />

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
          <p className="text-gray-400 text-[10px] mt-2">El caso iniciará en &ldquo;{pipeline.stages[0].name}&rdquo;</p>
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
          <Button type="submit" disabled={loading || !selectedSuscriptor}>{loading ? "Creando..." : "Crear Caso"}</Button>
        </div>
      </form>
    </div>
  );
}
