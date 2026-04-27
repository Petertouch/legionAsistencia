"use client";

import { useState, useEffect } from "react";
// Uses API routes instead of direct Supabase client for security
import { toast } from "sonner";
import { FileText, Save, Eye, Edit3, Trash2, Building2, Users, Plus } from "lucide-react";
import ContractView from "@/components/contract/contract-view";
import ClauseEditor, { type Clausula } from "@/components/contract/clause-editor";
import { type PlanConfig } from "@/components/contract/plan-editor";

interface FamiliaLimite {
  parentesco: string;
  max: number;
}

interface FamiliaConfig {
  limites: FamiliaLimite[];
}

const PARENTESCOS_DISPONIBLES = ["Cónyuge", "Hijo(a)", "Padre", "Madre", "Hermano(a)"];

interface Contrato {
  id: string;
  lead_id: string | null;
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
  nombre_cliente: string;
  cedula_cliente: string;
  firma_data: string | null;
  foto_data: string | null;
  hash: string | null;
  datos_completos: {
    departamento?: string;
    cedula_frente?: string;
    cedula_reverso?: string;
    lanza_code?: string;
  } | null;
  created_at: string;
}

interface PlantillaState {
  empresa_nombre: string;
  empresa_nit: string;
  duracion_meses: string;
  whatsapp: string;
  ficha_titulo: string;
  intro_contrato: string;
  clausulas_contrato: Clausula[];
  secciones_libranza: Clausula[];
  planes: PlanConfig[];
  familia_config: FamiliaConfig;
}

const DEFAULT_PLANTILLA: PlantillaState = {
  empresa_nombre: "CA CONSULTORES SAS",
  empresa_nit: "901.234.567-8",
  duracion_meses: "48",
  whatsapp: "573176689580",
  ficha_titulo: "FICHA DE VINCULACIÓN",
  intro_contrato: "Entre los suscritos, de una parte {empresa}, sociedad comercial identificada con NIT {nit}, representada legalmente, en adelante EL PRESTADOR, y de otra parte {nombre}, identificado(a) con cédula de ciudadanía No. {cedula}, en adelante EL SUSCRIPTOR, se celebra el presente contrato que se regirá por las siguientes cláusulas:",
  clausulas_contrato: [
    { titulo: "CLÁUSULA PRIMERA — OBJETO", contenido: "EL PRESTADOR se obliga a prestar los servicios de asesoría y asistencia jurídica integral contemplados en el plan seleccionado por EL SUSCRIPTOR." },
  ],
  secciones_libranza: [
    { titulo: "AUTORIZACIÓN", contenido: "Autorizo de manera libre, voluntaria e irrevocable a mi pagaduría para que descuente de mi asignación mensual la suma pactada." },
  ],
  planes: [
    { nombre: "Base", precio: "39.000", caracteristicas: ["Asesoría jurídica ilimitada"] },
    { nombre: "Plus", precio: "51.000", caracteristicas: ["Todo lo del Plan Base", "2 revisiones/mes"] },
    { nombre: "Élite", precio: "69.000", caracteristicas: ["Todo lo del Plan Plus", "Documentos ilimitados"] },
  ],
  familia_config: {
    limites: [
      { parentesco: "Cónyuge", max: 1 },
      { parentesco: "Hijo(a)", max: 2 },
      { parentesco: "Padre", max: 2 },
    ],
  },
};

const SAMPLE_CONTRACT_DATA = {
  nombre: "Juan Pérez Ejemplo",
  cedula: "1234567890",
  telefono: "3176689580",
  email: "ejemplo@mail.com",
  estado_civil: "Soltero",
  grado: "Sargento",
  fuerza: "Ejército",
  unidad: "Batallón de Infantería No. 1",
  direccion: "Calle 123 #45-67",
  ciudad: "Bogotá",
  plan: "Plus",
  plan_precio: "51.000",
};

export default function ContratosAdminPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"firmados" | "plantilla">("firmados");
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [plantilla, setPlantilla] = useState<PlantillaState>(DEFAULT_PLANTILLA);
  const [savingPlantilla, setSavingPlantilla] = useState(false);
  const [plantillaSection, setPlantillaSection] = useState<"empresa" | "ficha" | "contrato" | "libranza">("empresa");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [contratosRes, plantillaRes] = await Promise.all([
      fetch("/api/contratos"),
      fetch("/api/contratos/plantilla"),
    ]);
    const contratosData = contratosRes.ok ? await contratosRes.json() : [];
    const plantillaData = plantillaRes.ok ? await plantillaRes.json() : null;
    setContratos((contratosData || []) as Contrato[]);
    if (plantillaData) {
      setPlantilla({
        empresa_nombre: plantillaData.empresa_nombre || DEFAULT_PLANTILLA.empresa_nombre,
        empresa_nit: plantillaData.empresa_nit || DEFAULT_PLANTILLA.empresa_nit,
        duracion_meses: String(plantillaData.duracion_meses || 48),
        whatsapp: plantillaData.whatsapp || DEFAULT_PLANTILLA.whatsapp,
        ficha_titulo: plantillaData.ficha_titulo || DEFAULT_PLANTILLA.ficha_titulo,
        intro_contrato: plantillaData.intro_contrato || DEFAULT_PLANTILLA.intro_contrato,
        clausulas_contrato: (plantillaData.clausulas_contrato as Clausula[]) || DEFAULT_PLANTILLA.clausulas_contrato,
        secciones_libranza: (plantillaData.secciones_libranza as Clausula[]) || DEFAULT_PLANTILLA.secciones_libranza,
        planes: (plantillaData.planes as PlanConfig[]) || DEFAULT_PLANTILLA.planes,
        familia_config: (plantillaData.familia_config as FamiliaConfig)?.limites ? (plantillaData.familia_config as FamiliaConfig) : DEFAULT_PLANTILLA.familia_config,
      });
    }
    setLoading(false);
  };

  const savePlantilla = async () => {
    setSavingPlantilla(true);
    const res = await fetch("/api/contratos/plantilla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texto_contrato: plantilla.intro_contrato,
        texto_libranza: plantilla.secciones_libranza.map(s => `${s.titulo}: ${s.contenido}`).join("\n\n"),
        empresa_nombre: plantilla.empresa_nombre,
        empresa_nit: plantilla.empresa_nit,
        ficha_titulo: plantilla.ficha_titulo,
        intro_contrato: plantilla.intro_contrato,
        clausulas_contrato: plantilla.clausulas_contrato,
        secciones_libranza: plantilla.secciones_libranza,
        planes: plantilla.planes,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(`Error guardando plantilla: ${err.error}`);
    } else {
      toast.success("Plantilla actualizada");
    }
    setSavingPlantilla(false);
  };

  const deleteContrato = async (id: string) => {
    if (!confirm("¿Eliminar este contrato firmado?")) return;
    const res = await fetch(`/api/contratos?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setContratos((prev) => prev.filter((c) => c.id !== id));
      setSelectedContrato(null);
      toast.success("Contrato eliminado");
    } else {
      toast.error("Error eliminando contrato");
    }
  };

  const updatePlantilla = (field: string, value: string) =>
    setPlantilla((p) => ({ ...p, [field]: value }));

  const inputClass = "w-full bg-gray-50 text-gray-900 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/40 focus:outline-none";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-oro/30 border-t-oro rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-oro" /> Contratos
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">{contratos.length} contratos firmados</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 bg-gray-50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("firmados")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "firmados" ? "bg-amber-100 text-oro" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Eye className="w-4 h-4 inline mr-1.5" />
          Firmados ({contratos.length})
        </button>
        <button
          onClick={() => setTab("plantilla")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "plantilla" ? "bg-amber-100 text-oro" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Edit3 className="w-4 h-4 inline mr-1.5" />
          Plantilla
        </button>
      </div>

      {/* ═══ PLANTILLA TAB ═══ */}
      {tab === "plantilla" && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex gap-1 flex-wrap">
            {([
              { key: "empresa", label: "Empresa" },
              { key: "ficha", label: "Ficha de Vinculación" },
              { key: "contrato", label: "Cláusulas Contrato" },
              { key: "libranza", label: "Cláusulas Libranza" },
            ] as const).map((s) => (
              <button
                key={s.key}
                onClick={() => setPlantillaSection(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  plantillaSection === s.key
                    ? "bg-amber-100 text-oro"
                    : "bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor column */}
            <div className="space-y-4">
              {/* EMPRESA */}
              {plantillaSection === "empresa" && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                    <Building2 className="w-4 h-4 text-oro" />
                    <h2 className="text-gray-900 font-bold text-sm">Datos de la Empresa</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-gray-600 text-xs font-medium mb-1 block">Nombre empresa</label>
                      <input type="text" value={plantilla.empresa_nombre} onChange={(e) => updatePlantilla("empresa_nombre", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-gray-600 text-xs font-medium mb-1 block">NIT</label>
                      <input type="text" value={plantilla.empresa_nit} onChange={(e) => updatePlantilla("empresa_nit", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-gray-600 text-xs font-medium mb-1 block">Duración contrato (meses)</label>
                      <input type="number" value={plantilla.duracion_meses} onChange={(e) => updatePlantilla("duracion_meses", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-gray-600 text-xs font-medium mb-1 block">WhatsApp</label>
                      <input type="text" value={plantilla.whatsapp} onChange={(e) => updatePlantilla("whatsapp", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}

              {/* FICHA */}
              {plantillaSection === "ficha" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
                    <h2 className="text-gray-900 font-bold text-sm">Ficha de Vinculación</h2>
                    <div>
                      <label className="text-gray-500 text-xs font-medium mb-1 block">Título de la ficha</label>
                      <input type="text" value={plantilla.ficha_titulo} onChange={(e) => updatePlantilla("ficha_titulo", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  {/* Planes — solo lectura, se configuran en /admin/configuracion */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-gray-900 font-bold text-sm">Planes</h2>
                      <a href="/admin/configuracion" className="text-oro text-xs font-medium hover:underline">Editar en Configuración →</a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {plantilla.planes.map((plan, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                          <p className="text-gray-900 font-bold text-sm">{plan.nombre}</p>
                          <p className="text-oro font-bold text-lg">${plan.precio}<span className="text-gray-400 text-xs font-normal">/mes</span></p>
                          <ul className="mt-2 space-y-1">
                            {plan.caracteristicas.map((f, fi) => (
                              <li key={fi} className="text-gray-500 text-xs flex items-start gap-1"><span className="text-green-500">✓</span>{f}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuración de familia / beneficiarios */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-gray-900 font-bold text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" /> Familiares por plan
                      </h2>
                      <span className="text-gray-400 text-xs">
                        Total: {plantilla.familia_config.limites.reduce((sum, l) => sum + l.max, 0)} familiares
                      </span>
                    </div>

                    <p className="text-gray-400 text-[10px]">
                      Define cuántos familiares de cada tipo puede registrar un suscriptor. Aplica a todos los planes.
                    </p>

                    <div className="space-y-2">
                      {plantilla.familia_config.limites.map((limite, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                          <select
                            value={limite.parentesco}
                            onChange={(e) => {
                              const updated = [...plantilla.familia_config.limites];
                              updated[idx] = { ...updated[idx], parentesco: e.target.value };
                              setPlantilla((p) => ({ ...p, familia_config: { ...p.familia_config, limites: updated } }));
                            }}
                            className="bg-gray-50 text-gray-900 text-sm px-2 py-1.5 rounded-lg border border-gray-200 focus:border-jungle-dark/40 focus:outline-none flex-1"
                          >
                            {PARENTESCOS_DISPONIBLES.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>

                          <div className="flex items-center gap-2">
                            <label className="text-gray-500 text-xs">Máx:</label>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={limite.max}
                              onChange={(e) => {
                                const updated = [...plantilla.familia_config.limites];
                                updated[idx] = { ...updated[idx], max: parseInt(e.target.value) || 0 };
                                setPlantilla((p) => ({ ...p, familia_config: { ...p.familia_config, limites: updated } }));
                              }}
                              className="w-16 bg-gray-50 text-gray-900 text-sm text-center px-2 py-1.5 rounded-lg border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = plantilla.familia_config.limites.filter((_, i) => i !== idx);
                              setPlantilla((p) => ({ ...p, familia_config: { ...p.familia_config, limites: updated } }));
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        // Añadir un parentesco que no esté en la lista
                        const usados = new Set(plantilla.familia_config.limites.map((l) => l.parentesco));
                        const siguiente = PARENTESCOS_DISPONIBLES.find((p) => !usados.has(p)) || PARENTESCOS_DISPONIBLES[0];
                        setPlantilla((p) => ({
                          ...p,
                          familia_config: {
                            ...p.familia_config,
                            limites: [...p.familia_config.limites, { parentesco: siguiente, max: 1 }],
                          },
                        }));
                      }}
                      className="border-2 border-dashed border-gray-200 hover:border-jungle-dark/30 rounded-lg py-2 px-4 flex items-center justify-center gap-2 text-gray-500 hover:text-jungle-dark text-xs font-medium transition-colors w-full"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar tipo de familiar
                    </button>
                  </div>
                </div>
              )}

              {/* CONTRATO */}
              {plantillaSection === "contrato" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
                    <h2 className="text-gray-900 font-bold text-sm">Introducción del Contrato</h2>
                    <p className="text-gray-400 text-[10px]">Usa {"{empresa}"}, {"{nit}"}, {"{nombre}"}, {"{cedula}"} como variables</p>
                    <textarea
                      value={plantilla.intro_contrato}
                      onChange={(e) => updatePlantilla("intro_contrato", e.target.value)}
                      rows={4}
                      className={inputClass + " resize-y text-xs leading-relaxed"}
                    />
                  </div>
                  <ClauseEditor
                    clausulas={plantilla.clausulas_contrato}
                    onChange={(clausulas) => setPlantilla((p) => ({ ...p, clausulas_contrato: clausulas }))}
                    sectionLabel="Cláusulas del Contrato"
                  />
                </div>
              )}

              {/* LIBRANZA */}
              {plantillaSection === "libranza" && (
                <ClauseEditor
                  clausulas={plantilla.secciones_libranza}
                  onChange={(clausulas) => setPlantilla((p) => ({ ...p, secciones_libranza: clausulas }))}
                  sectionLabel="Secciones de la Libranza"
                />
              )}

              {/* Save button — always visible */}
              <button
                onClick={savePlantilla}
                disabled={savingPlantilla}
                className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 sticky bottom-4"
              >
                <Save className="w-4 h-4" /> {savingPlantilla ? "Guardando..." : "Guardar Plantilla"}
              </button>
            </div>

            {/* Preview column */}
            <div>
              <h2 className="text-gray-900 font-bold text-sm mb-3">Vista previa</h2>
              <div className="max-h-[80vh] overflow-y-auto pr-1">
                <ContractView
                  data={SAMPLE_CONTRACT_DATA}
                  plantilla={{
                    empresa_nombre: plantilla.empresa_nombre,
                    empresa_nit: plantilla.empresa_nit,
                    ficha_titulo: plantilla.ficha_titulo,
                    intro_contrato: plantilla.intro_contrato,
                    clausulas_contrato: plantilla.clausulas_contrato,
                    secciones_libranza: plantilla.secciones_libranza,
                    planes: plantilla.planes,
                  }}
                  readOnly
                  sections={
                    plantillaSection === "ficha" ? ["ficha"] :
                    plantillaSection === "contrato" ? ["contrato"] :
                    plantillaSection === "libranza" ? ["libranza"] :
                    undefined
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FIRMADOS TAB ═══ */}
      {tab === "firmados" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {contratos.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Sin contratos firmados</p>
                <p className="text-gray-400 text-xs mt-1">Los contratos aparecerán aquí cuando los leads firmen</p>
              </div>
            ) : (
              contratos.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContrato(c)}
                  className={`w-full text-left bg-gray-50 border rounded-xl p-3.5 transition-all ${
                    selectedContrato?.id === c.id ? "border-oro/40 bg-oro/5" : "border-gray-200 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-900 text-sm font-medium">{c.nombre_cliente}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">Firmado</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>C.C. {c.cedula_cliente}</span>
                    <span>•</span>
                    <span>{c.plan}</span>
                    <span>•</span>
                    <span>{new Date(c.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="lg:col-span-2">
            {selectedContrato ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-gray-900 font-bold text-sm">Contrato de {selectedContrato.nombre_cliente}</h2>
                  <button onClick={() => deleteContrato(selectedContrato.id)} className="text-red-600 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto pr-1">
                  <ContractView
                    data={{
                      nombre: selectedContrato.nombre || selectedContrato.nombre_cliente,
                      cedula: selectedContrato.cedula || selectedContrato.cedula_cliente,
                      telefono: selectedContrato.telefono || "",
                      telefono2: selectedContrato.telefono2 || "",
                      email: selectedContrato.email || "",
                      estado_civil: selectedContrato.estado_civil || "",
                      grado: selectedContrato.grado || "",
                      fuerza: selectedContrato.fuerza || "",
                      unidad: selectedContrato.unidad || "",
                      direccion: selectedContrato.direccion || "",
                      ciudad: selectedContrato.ciudad || "",
                      departamento: selectedContrato.datos_completos?.departamento || "",
                      plan: selectedContrato.plan,
                      plan_precio: selectedContrato.precio || "",
                      firma_data: selectedContrato.firma_data || undefined,
                      foto_data: selectedContrato.foto_data || undefined,
                      cedula_frente: selectedContrato.datos_completos?.cedula_frente || undefined,
                      cedula_reverso: selectedContrato.datos_completos?.cedula_reverso || undefined,
                      hash: selectedContrato.hash || undefined,
                      fecha: new Date(selectedContrato.created_at).toLocaleDateString("es-CO", {
                        day: "numeric", month: "long", year: "numeric",
                      }),
                    }}
                    readOnly
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                <FileText className="w-10 h-10 text-beige/15 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Selecciona un contrato para ver el detalle</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
