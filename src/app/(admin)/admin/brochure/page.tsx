"use client";

import { useState, useRef } from "react";
import { Download, Pencil, Eye, X, Save, FileText, Shield, Scale, Users, Phone, Mail, Globe, Award, CheckCircle2, ChevronRight } from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";

interface BrochureContent {
  tagline: string;
  subtitulo: string;
  historia: string;
  mision: string;
  vision: string;
  valores: string[];
  servicios: { titulo: string; descripcion: string }[];
  diferenciadores: { titulo: string; descripcion: string }[];
  estadisticas: { valor: string; label: string }[];
  telefono: string;
  email: string;
  web: string;
  direccion: string;
  whatsapp: string;
}

const DEFAULT_CONTENT: BrochureContent = {
  tagline: "Tu misión es servir a la patria. La nuestra es protegerte.",
  subtitulo: "Asistencia jurídica integral y especializada para miembros de las Fuerzas Militares y Policía Nacional de Colombia.",
  historia: "Legión Jurídica nace de la necesidad real de proteger legalmente a quienes dedican su vida a proteger a Colombia. Fundada por un equipo de abogados especializados en derecho militar, penal militar y disciplinario, entendemos las particularidades del servicio en la fuerza pública y las complejidades legales que enfrentan sus miembros a diario. No somos un bufete genérico — somos el escudo legal de la fuerza pública.",
  mision: "Brindar asesoría y representación jurídica de excelencia a los miembros de las Fuerzas Militares y Policía Nacional, garantizando la protección de sus derechos con un servicio accesible, oportuno y especializado.",
  vision: "Ser la firma de referencia en asistencia legal militar en Colombia, reconocida por su compromiso con la justicia, la innovación en el servicio y la protección integral del servidor público.",
  valores: [
    "Compromiso con la fuerza pública",
    "Excelencia jurídica",
    "Confidencialidad absoluta",
    "Respuesta oportuna",
    "Accesibilidad",
    "Integridad profesional",
  ],
  servicios: [
    { titulo: "Derecho Disciplinario", descripcion: "Defensa en procesos disciplinarios, descargos, recursos de apelación y acompañamiento en todas las etapas del proceso." },
    { titulo: "Derecho Penal Militar", descripcion: "Representación ante la jurisdicción penal militar. Defensa en consejos de guerra, audiencias y sentencias." },
    { titulo: "Derecho de Familia", descripcion: "Custodia, alimentos, divorcios y regulación de visitas adaptados a la realidad del servicio militar." },
    { titulo: "Derecho Civil y Consumidor", descripcion: "Reclamaciones por cobros indebidos, créditos de libranza, seguros y derechos del consumidor." },
    { titulo: "Documentos Legales", descripcion: "Derechos de petición, tutelas, recursos y cualquier documento jurídico que necesites." },
    { titulo: "Asesoría Legal Ilimitada", descripcion: "Consultas ilimitadas por WhatsApp, llamada o portal digital. Tu abogado siempre disponible." },
  ],
  diferenciadores: [
    { titulo: "Especialización militar", descripcion: "No somos generalistas. Nuestro equipo está formado exclusivamente por abogados con experiencia en justicia militar y policial." },
    { titulo: "Tecnología al servicio", descripcion: "Portal digital donde el suscriptor sigue sus casos en tiempo real, recibe notificaciones y se comunica con su abogado." },
    { titulo: "Cobertura familiar", descripcion: "Los planes incluyen cobertura para cónyuge, hijos y padres dependientes del suscriptor." },
    { titulo: "Presencia en guarniciones", descripcion: "Red de aliados en batallones y unidades militares para atención directa y personalizada." },
  ],
  estadisticas: [
    { valor: "500+", label: "Militares protegidos" },
    { valor: "98%", label: "Casos resueltos favorablemente" },
    { valor: "24h", label: "Tiempo de respuesta" },
    { valor: "7", label: "Áreas legales cubiertas" },
  ],
  telefono: "317 668 9580",
  email: "info@legionjuridica.com",
  web: "legionjuridica.com",
  direccion: "Cra 7 #81-49 Of. 301, Bogotá",
  whatsapp: "573176689580",
};

export default function BrochurePage() {
  const [content, setContent] = useState<BrochureContent>(DEFAULT_CONTENT);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(true);
  const brochureRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const updateField = (field: keyof BrochureContent, value: unknown) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-oro" /> Brochure Corporativo
          </h1>
          <p className="text-gray-500 text-xs mt-1">Presentación institucional para comandantes y directivos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)} className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${editing ? "bg-oro/10 text-oro border-oro/30" : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-900"}`}>
            {editing ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {editing ? "Vista previa" : "Editar"}
          </button>
          <Button size="sm" onClick={handlePrint}>
            <Download className="w-4 h-4" /> Descargar PDF
          </Button>
        </div>
      </div>

      {/* Brochure */}
      <div ref={brochureRef} className="print-brochure bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* ═══ COVER ═══ */}
        <div className="relative bg-[#0F1A0F] text-white overflow-hidden" style={{ minHeight: "500px" }}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8A96E' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0F1A0F] to-transparent" />

          <div className="relative px-12 py-16 flex flex-col justify-between" style={{ minHeight: "500px" }}>
            {/* Top */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/images/logo.svg" alt="Legión" width={48} height={48} />
                <div>
                  <p className="text-[#C8A96E] font-black text-lg tracking-[0.2em]">LEGIÓN</p>
                  <p className="text-[#C8A96E]/60 text-[10px] tracking-[0.3em] uppercase">Jurídica</p>
                </div>
              </div>
              <p className="text-white/20 text-[10px] tracking-widest uppercase">Presentación Corporativa</p>
            </div>

            {/* Center */}
            <div className="max-w-xl">
              <div className="w-16 h-0.5 bg-[#C8A96E] mb-6" />
              {editing ? (
                <textarea value={content.tagline} onChange={(e) => updateField("tagline", e.target.value)} rows={2} className="w-full bg-transparent text-white text-3xl font-black leading-tight focus:outline-none border-b border-white/10 resize-none" />
              ) : (
                <h1 className="text-3xl md:text-4xl font-black leading-tight">{content.tagline}</h1>
              )}
              <div className="w-16 h-0.5 bg-[#C8A96E] mt-6 mb-4" />
              {editing ? (
                <textarea value={content.subtitulo} onChange={(e) => updateField("subtitulo", e.target.value)} rows={3} className="w-full bg-transparent text-white/60 text-sm leading-relaxed focus:outline-none border-b border-white/10 resize-none" />
              ) : (
                <p className="text-white/60 text-sm md:text-base leading-relaxed">{content.subtitulo}</p>
              )}
            </div>

            {/* Bottom stats */}
            <div className="grid grid-cols-4 gap-6 pt-8 border-t border-white/10">
              {content.estadisticas.map((stat, i) => (
                <div key={i}>
                  {editing ? (
                    <>
                      <input value={stat.valor} onChange={(e) => { const s = [...content.estadisticas]; s[i] = { ...s[i], valor: e.target.value }; updateField("estadisticas", s); }} className="bg-transparent text-[#C8A96E] text-2xl font-black focus:outline-none border-b border-white/10 w-full" />
                      <input value={stat.label} onChange={(e) => { const s = [...content.estadisticas]; s[i] = { ...s[i], label: e.target.value }; updateField("estadisticas", s); }} className="bg-transparent text-white/40 text-xs focus:outline-none border-b border-white/10 w-full mt-1" />
                    </>
                  ) : (
                    <>
                      <p className="text-[#C8A96E] text-2xl md:text-3xl font-black">{stat.valor}</p>
                      <p className="text-white/40 text-xs mt-1">{stat.label}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ HISTORIA ═══ */}
        <div className="px-12 py-14 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#0F1A0F] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#C8A96E]" />
            </div>
            <div>
              <p className="text-[#C8A96E] text-[10px] font-bold uppercase tracking-[0.2em]">Quiénes somos</p>
              <h2 className="text-gray-900 text-xl font-bold">Nuestra Historia</h2>
            </div>
          </div>
          {editing ? (
            <textarea value={content.historia} onChange={(e) => updateField("historia", e.target.value)} rows={5} className="w-full text-gray-600 text-sm leading-relaxed focus:outline-none border border-gray-200 rounded-lg p-3 resize-none" />
          ) : (
            <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-3xl">{content.historia}</p>
          )}
        </div>

        {/* ═══ MISIÓN, VISIÓN, VALORES ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100">
          {/* Misión */}
          <div className="px-10 py-10 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="w-8 h-8 bg-[#C8A96E]/10 rounded-lg flex items-center justify-center mb-4">
              <Scale className="w-4 h-4 text-[#C8A96E]" />
            </div>
            <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-3">Misión</h3>
            {editing ? (
              <textarea value={content.mision} onChange={(e) => updateField("mision", e.target.value)} rows={5} className="w-full text-gray-600 text-xs leading-relaxed focus:outline-none border border-gray-200 rounded p-2 resize-none" />
            ) : (
              <p className="text-gray-600 text-xs leading-relaxed">{content.mision}</p>
            )}
          </div>
          {/* Visión */}
          <div className="px-10 py-10 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="w-8 h-8 bg-[#C8A96E]/10 rounded-lg flex items-center justify-center mb-4">
              <Eye className="w-4 h-4 text-[#C8A96E]" />
            </div>
            <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-3">Visión</h3>
            {editing ? (
              <textarea value={content.vision} onChange={(e) => updateField("vision", e.target.value)} rows={5} className="w-full text-gray-600 text-xs leading-relaxed focus:outline-none border border-gray-200 rounded p-2 resize-none" />
            ) : (
              <p className="text-gray-600 text-xs leading-relaxed">{content.vision}</p>
            )}
          </div>
          {/* Valores */}
          <div className="px-10 py-10">
            <div className="w-8 h-8 bg-[#C8A96E]/10 rounded-lg flex items-center justify-center mb-4">
              <Award className="w-4 h-4 text-[#C8A96E]" />
            </div>
            <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-3">Valores</h3>
            <ul className="space-y-2">
              {content.valores.map((v, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C8A96E] rounded-full flex-shrink-0" />
                  {editing ? (
                    <input value={v} onChange={(e) => { const vals = [...content.valores]; vals[i] = e.target.value; updateField("valores", vals); }} className="text-gray-600 text-xs focus:outline-none border-b border-gray-200 w-full" />
                  ) : (
                    <span className="text-gray-600 text-xs">{v}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ═══ SERVICIOS ═══ */}
        <div className="px-12 py-14 bg-[#FAFAF8] border-b border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0F1A0F] rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-[#C8A96E]" />
            </div>
            <div>
              <p className="text-[#C8A96E] text-[10px] font-bold uppercase tracking-[0.2em]">Qué hacemos</p>
              <h2 className="text-gray-900 text-xl font-bold">Nuestros Servicios</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {content.servicios.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#C8A96E]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-[#C8A96E]" />
                  </div>
                  <div>
                    {editing ? (
                      <>
                        <input value={s.titulo} onChange={(e) => { const svs = [...content.servicios]; svs[i] = { ...svs[i], titulo: e.target.value }; updateField("servicios", svs); }} className="text-gray-900 font-bold text-sm focus:outline-none border-b border-gray-200 w-full mb-2" />
                        <textarea value={s.descripcion} onChange={(e) => { const svs = [...content.servicios]; svs[i] = { ...svs[i], descripcion: e.target.value }; updateField("servicios", svs); }} rows={3} className="text-gray-500 text-xs leading-relaxed focus:outline-none border border-gray-200 rounded p-1 w-full resize-none" />
                      </>
                    ) : (
                      <>
                        <h3 className="text-gray-900 font-bold text-sm mb-1">{s.titulo}</h3>
                        <p className="text-gray-500 text-xs leading-relaxed">{s.descripcion}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ DIFERENCIADORES ═══ */}
        <div className="px-12 py-14 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0F1A0F] rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-[#C8A96E]" />
            </div>
            <div>
              <p className="text-[#C8A96E] text-[10px] font-bold uppercase tracking-[0.2em]">Por qué elegirnos</p>
              <h2 className="text-gray-900 text-xl font-bold">Lo Que Nos Hace Diferentes</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.diferenciadores.map((d, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0F1A0F] to-[#1a2e1a] rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-[#C8A96E]" />
                </div>
                <div>
                  {editing ? (
                    <>
                      <input value={d.titulo} onChange={(e) => { const ds = [...content.diferenciadores]; ds[i] = { ...ds[i], titulo: e.target.value }; updateField("diferenciadores", ds); }} className="text-gray-900 font-bold text-sm focus:outline-none border-b border-gray-200 w-full mb-1" />
                      <textarea value={d.descripcion} onChange={(e) => { const ds = [...content.diferenciadores]; ds[i] = { ...ds[i], descripcion: e.target.value }; updateField("diferenciadores", ds); }} rows={2} className="text-gray-600 text-xs leading-relaxed focus:outline-none border border-gray-200 rounded p-1 w-full resize-none" />
                    </>
                  ) : (
                    <>
                      <h3 className="text-gray-900 font-bold text-sm mb-1">{d.titulo}</h3>
                      <p className="text-gray-600 text-xs leading-relaxed">{d.descripcion}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CONTACTO ═══ */}
        <div className="bg-[#0F1A0F] text-white px-12 py-14">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#C8A96E]/10 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#C8A96E]" />
            </div>
            <div>
              <p className="text-[#C8A96E] text-[10px] font-bold uppercase tracking-[0.2em]">Contacto</p>
              <h2 className="text-white text-xl font-bold">Hablemos</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              {[
                { icon: Phone, label: "Teléfono", field: "telefono" as const },
                { icon: Mail, label: "Email", field: "email" as const },
                { icon: Globe, label: "Web", field: "web" as const },
                { icon: Users, label: "Dirección", field: "direccion" as const },
              ].map(({ icon: Icon, label, field }) => (
                <div key={field} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#C8A96E]" />
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider">{label}</p>
                    {editing ? (
                      <input value={content[field]} onChange={(e) => updateField(field, e.target.value)} className="bg-transparent text-white text-sm font-medium focus:outline-none border-b border-white/10 w-full" />
                    ) : (
                      <p className="text-white text-sm font-medium">{content[field]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <Image src="/images/logo.svg" alt="Legión" width={60} height={60} className="mb-4 opacity-60" />
                <p className="text-white/40 text-xs leading-relaxed">
                  Legión Jurídica es una firma especializada en derecho militar y policial, comprometida con la protección legal de quienes sirven a Colombia.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-[#C8A96E] font-black text-sm tracking-[0.15em]">LEGIÓN JURÍDICA</p>
                <p className="text-white/30 text-[10px] mt-1">© {new Date().getFullYear()} · Todos los derechos reservados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          .print-brochure { border: none !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
