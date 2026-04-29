"use client";

import { useState } from "react";
import Image from "next/image";
import { Shield, Scale, Users, Phone, Mail, Globe, Award, CheckCircle2, ChevronRight, Download, Eye } from "lucide-react";

export default function PresentacionPublicaPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim() || !email.trim()) { setError("Completa ambos campos"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/brochure-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), email: email.trim() }),
      });
      if (!res.ok) { setError("Error al registrar"); setLoading(false); return; }
      setAuthorized(true);
    } catch { setError("Error de conexión"); }
    setLoading(false);
  };

  // Gate: ask for name + email before showing
  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0F1A0F] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <Image src="/images/logo.svg" alt="Legión" width={56} height={56} className="mx-auto mb-4" />
            <h1 className="text-[#C8A96E] font-black text-xl tracking-[0.15em]">LEGIÓN JURÍDICA</h1>
            <p className="text-white/40 text-xs mt-2 tracking-wider uppercase">Presentación Corporativa</p>
          </div>

          <form onSubmit={handleAccess} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <p className="text-white/60 text-sm text-center">Ingresa tus datos para acceder a la presentación</p>
            <div>
              <label className="text-white/40 text-xs font-medium mb-1 block">Nombre completo</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" required
                className="w-full bg-white/5 text-white placeholder-white/20 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-[#C8A96E]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium mb-1 block">Correo electrónico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required
                className="w-full bg-white/5 text-white placeholder-white/20 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-[#C8A96E]/50 focus:outline-none" />
            </div>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-[#C8A96E] text-[#0F1A0F] font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? "Verificando..." : "Ver presentación"}
            </button>
          </form>

          <p className="text-white/20 text-[10px] text-center">Tus datos son confidenciales y no serán compartidos.</p>
        </div>
      </div>
    );
  }

  // ═══ BROCHURE (same as admin but read-only) ═══
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.svg" alt="Legión" width={28} height={28} />
          <span className="text-[#C8A96E] font-black text-sm tracking-[0.1em]">LEGIÓN JURÍDICA</span>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-[#0F1A0F] text-[#C8A96E] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#1a2e1a] transition-colors">
          <Download className="w-3.5 h-3.5" /> Descargar PDF
        </button>
      </div>

      <div className="max-w-5xl mx-auto my-6 print-brochure bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* ═══ COVER ═══ */}
        <div className="slide relative bg-[#0F1A0F] text-white overflow-hidden" style={{ minHeight: "500px" }}>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8A96E' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0F1A0F] to-transparent" />
          <div className="relative px-12 py-16 flex flex-col justify-between" style={{ minHeight: "500px" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image src="/images/logo.svg" alt="Legión" width={48} height={48} />
                <p className="text-[#C8A96E] font-black text-xl tracking-[0.15em]">LEGIÓN <span className="font-bold text-[#C8A96E]/60">Jurídica</span></p>
              </div>
              <p className="text-white/20 text-[10px] tracking-widest uppercase">Presentación Corporativa</p>
            </div>
            <div className="max-w-xl">
              <div className="w-16 h-0.5 bg-[#C8A96E] mb-6" />
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Tu misión es servir a la patria. La nuestra es protegerte.</h1>
              <div className="w-16 h-0.5 bg-[#C8A96E] mt-6 mb-4" />
              <p className="text-white/60 text-sm md:text-base leading-relaxed">Asistencia jurídica integral y especializada para miembros de las Fuerzas Militares y Policía Nacional de Colombia.</p>
            </div>
            <div className="grid grid-cols-4 gap-6 pt-8 border-t border-white/10">
              {[{ v: "500+", l: "Militares protegidos" }, { v: "98%", l: "Casos resueltos" }, { v: "24h", l: "Tiempo de respuesta" }, { v: "7", l: "Áreas legales" }].map((s, i) => (
                <div key={i}><p className="text-[#C8A96E] text-2xl md:text-3xl font-black">{s.v}</p><p className="text-white/40 text-xs mt-1">{s.l}</p></div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ HISTORIA ═══ */}
        <div className="slide px-12 py-14 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#0F1A0F] rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-[#C8A96E]" /></div>
            <div><p className="text-[#C8A96E] text-[10px] font-bold uppercase tracking-[0.2em]">Quiénes somos</p><h2 className="text-gray-900 text-xl font-bold">Nuestra Historia</h2></div>
          </div>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-3xl">Legión Jurídica nace de la necesidad real de proteger legalmente a quienes dedican su vida a proteger a Colombia. Fundada por un equipo de abogados especializados en derecho militar, penal militar y disciplinario, entendemos las particularidades del servicio en la fuerza pública y las complejidades legales que enfrentan sus miembros a diario. No somos un bufete genérico — somos el escudo legal de la fuerza pública.</p>
        </div>

        {/* ═══ MISIÓN, VISIÓN, VALORES ═══ */}
        <div className="slide grid grid-cols-1 md:grid-cols-3 border-b border-gray-100">
          <div className="px-10 py-10 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="w-8 h-8 bg-[#C8A96E]/10 rounded-lg flex items-center justify-center mb-4"><Scale className="w-4 h-4 text-[#C8A96E]" /></div>
            <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-3">Misión</h3>
            <p className="text-gray-600 text-xs leading-relaxed">Brindar asesoría y representación jurídica de excelencia a los miembros de las Fuerzas Militares y Policía Nacional, garantizando la protección de sus derechos con un servicio accesible, oportuno y especializado.</p>
          </div>
          <div className="px-10 py-10 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="w-8 h-8 bg-[#C8A96E]/10 rounded-lg flex items-center justify-center mb-4"><Eye className="w-4 h-4 text-[#C8A96E]" /></div>
            <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-3">Visión</h3>
            <p className="text-gray-600 text-xs leading-relaxed">Ser la firma de referencia en asistencia legal militar en Colombia, reconocida por su compromiso con la justicia, la innovación en el servicio y la protección integral del servidor público.</p>
          </div>
          <div className="px-10 py-10">
            <div className="w-8 h-8 bg-[#C8A96E]/10 rounded-lg flex items-center justify-center mb-4"><Award className="w-4 h-4 text-[#C8A96E]" /></div>
            <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-3">Valores</h3>
            <ul className="space-y-2">
              {["Compromiso con la fuerza pública", "Excelencia jurídica", "Confidencialidad absoluta", "Respuesta oportuna", "Accesibilidad", "Integridad profesional"].map((v, i) => (
                <li key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#C8A96E] rounded-full flex-shrink-0" /><span className="text-gray-600 text-xs">{v}</span></li>
              ))}
            </ul>
          </div>
        </div>

        {/* ═══ SERVICIOS ═══ */}
        <div className="slide px-12 py-14 bg-[#FAFAF8] border-b border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0F1A0F] rounded-lg flex items-center justify-center"><Scale className="w-5 h-5 text-[#C8A96E]" /></div>
            <div><p className="text-[#C8A96E] text-[10px] font-bold uppercase tracking-[0.2em]">Qué hacemos</p><h2 className="text-gray-900 text-xl font-bold">Nuestros Servicios</h2></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { t: "Derecho Disciplinario", d: "Defensa en procesos disciplinarios, descargos, recursos de apelación y acompañamiento en todas las etapas." },
              { t: "Derecho Penal y Penal Militar", d: "Representación ante la jurisdicción penal ordinaria y penal militar. Defensa en audiencias, consejos de guerra y sentencias." },
              { t: "Derecho de Familia", d: "Custodia, alimentos, divorcios y regulación de visitas adaptados a la realidad del servicio militar." },
              { t: "Derecho Civil y Consumidor", d: "Reclamaciones por cobros indebidos, créditos de libranza, seguros y derechos del consumidor." },
              { t: "Documentos Legales", d: "Derechos de petición, tutelas, recursos y cualquier documento jurídico que necesites." },
              { t: "Asesoría Legal Ilimitada", d: "Consultas ilimitadas por WhatsApp, llamada o portal digital. Tu abogado siempre disponible." },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#C8A96E]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"><ChevronRight className="w-4 h-4 text-[#C8A96E]" /></div>
                  <div><h3 className="text-gray-900 font-bold text-sm mb-1">{s.t}</h3><p className="text-gray-500 text-xs leading-relaxed">{s.d}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ PLANES ═══ */}
        <div className="slide px-12 py-14 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0F1A0F] rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-[#C8A96E]" /></div>
            <div><p className="text-[#C8A96E] text-[10px] font-bold uppercase tracking-[0.2em]">Planes de Suscripción</p><h2 className="text-gray-900 text-xl font-bold">Protección Para Cada Necesidad</h2></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { nombre: "Base", precio: "$47.000", features: ["Asesoría jurídica ilimitada", "2 representaciones / año", "4 opiniones / mes", "Revisión de documentos", "Atención por WhatsApp", "2 familiares T&C"] },
              { nombre: "Plus", precio: "$60.000", popular: true, features: ["Todo lo del Base, más:", "3 representaciones / año", "8 opiniones / mes", "Prioridad en asignación", "WhatsApp y llamada", "3 familiares T&C", "Junta Médica"] },
              { nombre: "Élite", precio: "$78.000", features: ["Todo lo del Plus, más:", "5 representaciones / año", "Opiniones ilimitadas", "Abogado dedicado", "Atención prioritaria 24/7", "4 familiares T&C", "Junta Médica"] },
            ].map((plan) => (
              <div key={plan.nombre} className={`relative rounded-xl border-2 ${plan.popular ? "border-[#C8A96E] bg-[#FAFAF8] shadow-md" : "border-gray-200 bg-white"} p-6`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C8A96E] text-white text-[9px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">Más popular</div>}
                <div className="text-center mb-5"><h3 className="text-gray-900 font-bold text-lg">{plan.nombre}</h3><div className="flex items-baseline justify-center gap-1 mt-2"><span className="text-gray-900 text-3xl font-black">{plan.precio}</span><span className="text-gray-400 text-sm">/mes</span></div></div>
                <div className="w-full h-px bg-gray-100 mb-5" />
                <ul className="space-y-3">{plan.features.map((f, i) => (<li key={i} className="flex items-start gap-2.5"><CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? "text-[#C8A96E]" : "text-gray-400"}`} /><span className="text-gray-600 text-xs leading-relaxed">{f}</span></li>))}</ul>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ DIFERENCIADORES ═══ */}
        <div className="slide px-12 py-14 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0F1A0F] rounded-lg flex items-center justify-center"><Award className="w-5 h-5 text-[#C8A96E]" /></div>
            <div><p className="text-[#C8A96E] text-[10px] font-bold uppercase tracking-[0.2em]">Por qué elegirnos</p><h2 className="text-gray-900 text-xl font-bold">Lo Que Nos Hace Diferentes</h2></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { t: "Especialización militar", d: "No somos generalistas. Nuestro equipo está formado exclusivamente por abogados con experiencia en justicia militar y policial." },
              { t: "Tecnología al servicio", d: "Portal digital donde el suscriptor sigue sus casos en tiempo real, recibe notificaciones y se comunica con su abogado." },
              { t: "Cobertura familiar", d: "Los planes incluyen cobertura para cónyuge, hijos y padres dependientes del suscriptor." },
              { t: "Presencia en guarniciones", d: "Red de aliados en batallones y unidades militares para atención directa y personalizada." },
            ].map((d, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0F1A0F] to-[#1a2e1a] rounded-xl flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-6 h-6 text-[#C8A96E]" /></div>
                <div><h3 className="text-gray-900 font-bold text-sm mb-1">{d.t}</h3><p className="text-gray-600 text-xs leading-relaxed">{d.d}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CONTACTO ═══ */}
        <div className="slide bg-[#0F1A0F] text-white px-12 py-14">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#C8A96E]/10 rounded-lg flex items-center justify-center"><Phone className="w-5 h-5 text-[#C8A96E]" /></div>
            <div><p className="text-[#C8A96E] text-[10px] font-bold uppercase tracking-[0.2em]">Contacto</p><h2 className="text-white text-xl font-bold">Hablemos</h2></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              {[{ Icon: Phone, l: "Teléfono", v: "317 668 9580" }, { Icon: Mail, l: "Email", v: "info@legionjuridica.com" }, { Icon: Globe, l: "Web", v: "legionjuridica.com" }, { Icon: Users, l: "Dirección", v: "Cra 7 #81-49 Of. 301, Bogotá" }].map(({ Icon, l, v }) => (
                <div key={l} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-[#C8A96E]" /></div>
                  <div><p className="text-white/40 text-[10px] uppercase tracking-wider">{l}</p><p className="text-white text-sm font-medium">{v}</p></div>
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <Image src="/images/logo.svg" alt="Legión" width={60} height={60} className="mb-4 opacity-60" />
                <p className="text-white/40 text-xs leading-relaxed">Legión Jurídica es una firma especializada en derecho militar y policial, comprometida con la protección legal de quienes sirven a Colombia.</p>
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
          nav, .sticky { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .print-brochure { border: none !important; border-radius: 0 !important; box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          .slide { page-break-before: always; page-break-inside: avoid; }
          .slide:first-child { page-break-before: avoid; }
          @page { margin: 0; }
        }
      `}</style>
    </div>
  );
}
