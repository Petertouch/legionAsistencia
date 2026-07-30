"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { BLOG_ARTICLES, BLOG_CATEGORIES, CATEGORY_COLORS } from "@/lib/blog-data";
import {
  Search, ChevronRight, BookOpen, Send, CheckCircle2, MessageCircle, Scale,
  ShieldCheck, Clock, Lock, Share2, Users, ArrowRight, HelpCircle, X,
} from "lucide-react";

const ITEMS_PER_PAGE = 9;
const WA = "https://wa.me/573176689580";
const SHARE_TEXT = "Consulta legal GRATIS para militares y policías 👉 Un abogado te responde. https://legionjuridica.com/blog";
const SHARE_URL = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`;

// Áreas rápidas para el formulario (subconjunto de categorías).
const AREAS_RAPIDAS = ["Disciplinarios", "Penal Militar", "Salud y Pensión", "Ascensos y Carrera", "Familia", "Derechos Laborales"];

// ── Formulario de consulta (protagonista) ──────────────────────────
function ConsultaForm() {
  const [step, setStep] = useState<"form" | "code" | "done">("form");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [pregunta, setPregunta] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim() || !apellido.trim() || !telefono.trim() || !email.trim() || !pregunta.trim()) {
      setError("Completa todos los campos"); return;
    }
    if (pregunta.trim().length < 15) {
      setError("Describe tu situación con al menos 15 caracteres"); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/consultas-blog/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), apellido: apellido.trim(), telefono: telefono.trim(), email: email.trim(), area: area || "General", pregunta: pregunta.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al enviar"); return; }
      setStep("code");
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) { setError("Ingresa el código"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/consultas-blog/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Código inválido"); return; }
      setStep("done");
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-white text-gray-900 text-sm px-3.5 py-3 rounded-xl border border-gray-200 placeholder-gray-400 focus:outline-none focus:border-oro focus:ring-2 focus:ring-oro/20 transition-all";

  return (
    <div id="consultar" className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-5 sm:p-6">
      {step === "form" && (
        <form onSubmit={handleSendCode} className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-oro/15 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-oro" />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-sm leading-tight">Escribe tu consulta</p>
              <p className="text-gray-400 text-[11px] leading-tight">Orientación gratuita · confidencial · a tu correo</p>
            </div>
          </div>

          <textarea
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Cuéntanos tu situación. Ej: Me notificaron una investigación disciplinaria, ¿qué debo hacer?"
            rows={4}
            className={`${inputCls} resize-none`}
            required
          />

          {/* Áreas rápidas */}
          <div className="flex flex-wrap gap-1.5">
            {AREAS_RAPIDAS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setArea(area === a ? "" : a)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                  area === a ? "bg-jungle-dark text-white border-jungle-dark" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-oro/40"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre *" className={inputCls} required />
            <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Apellido *" className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))} placeholder="WhatsApp *" inputMode="numeric" className={inputCls} required />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo *" className={inputCls} required />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-oro/30 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-jungle-dark/30 border-t-jungle-dark rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? "Enviando..." : "Enviar mi consulta gratis"}
          </button>
          <p className="text-gray-400 text-[10px] text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Te enviaremos un código al correo para verificarte. No compartimos tus datos.
          </p>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-oro/15 rounded-full flex items-center justify-center mx-auto mb-2">
              <Lock className="w-5 h-5 text-oro" />
            </div>
            <p className="text-gray-900 font-bold text-sm">Verifica tu correo</p>
            <p className="text-gray-500 text-xs mt-1">Enviamos un código de 6 dígitos a</p>
            <p className="text-jungle-dark font-bold text-sm">{email}</p>
            <p className="text-gray-400 text-[10px] mt-0.5">Revisa tu bandeja de entrada y spam</p>
          </div>
          <div className="flex justify-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[i] || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (!val && e.nativeEvent instanceof InputEvent && e.nativeEvent.inputType === "deleteContentBackward") {
                    setCode(code.slice(0, i) + code.slice(i + 1));
                    (e.target.previousElementSibling as HTMLInputElement | null)?.focus();
                    return;
                  }
                  if (!val) return;
                  setCode((code.slice(0, i) + val[0] + code.slice(i + 1)).slice(0, 6));
                  if (val) (e.target.nextElementSibling as HTMLInputElement | null)?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !code[i]) {
                    const prev = (e.target as HTMLElement).previousElementSibling;
                    if (prev instanceof HTMLInputElement) prev.focus();
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                  if (pasted) setCode(pasted);
                }}
                className={`w-11 h-14 bg-gray-50 rounded-xl border-2 text-center text-2xl font-black focus:outline-none transition-all ${code[i] ? "border-oro text-gray-900" : "border-gray-200 text-gray-300"} focus:border-oro focus:ring-2 focus:ring-oro/20`}
                autoFocus={i === 0}
              />
            ))}
          </div>
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button type="submit" disabled={loading || code.length !== 6} className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-oro/30 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-jungle-dark/30 border-t-jungle-dark rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? "Verificando..." : "Verificar y enviar consulta"}
          </button>
          <button type="button" onClick={() => { setStep("form"); setCode(""); setError(""); }} className="text-gray-400 text-xs hover:text-gray-700 transition-colors block mx-auto">
            ← Volver
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-gray-900 font-bold text-base mb-2">¡Consulta recibida! ⚖️</h3>
          <p className="text-gray-500 text-sm mb-4">
            Un abogado revisará tu caso y te enviará una <strong className="text-gray-900">orientación</strong> a <strong className="text-gray-900">{email}</strong> en un promedio de <strong className="text-jungle-dark">8 horas</strong>. Es una guía general, no un documento ni una representación.
          </p>
          <div className="flex flex-col gap-2">
            <a href={SHARE_URL} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <Share2 className="w-4 h-4" /> Comparte con tu compañía
            </a>
            <button onClick={() => { setStep("form"); setNombre(""); setApellido(""); setTelefono(""); setEmail(""); setArea(""); setPregunta(""); setCode(""); setError(""); }}
              className="text-oro text-sm font-medium hover:underline">
              Hacer otra consulta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feed de consultas resueltas (datos reales) ─────────────────────
interface ConsultaPublica {
  id: string;
  nombre: string;
  area: string;
  pregunta: string;
  respuesta: string;
  respondido_por: string;
  respondido_at: string | null;
}

function CommunityFeed({ onCount }: { onCount: (n: number) => void }) {
  const [items, setItems] = useState<ConsultaPublica[]>([]);
  const [selected, setSelected] = useState<ConsultaPublica | null>(null);

  useEffect(() => {
    fetch("/api/consultas-blog/publicas")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: ConsultaPublica[]) => { setItems(d); onCount(d.length); })
      .catch(() => {});
  }, [onCount]);

  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-oro" />
        <h2 className="text-gray-900 text-xl sm:text-2xl font-black">Orientaciones resueltas por nuestros abogados</h2>
      </div>
      <p className="text-gray-500 text-sm mb-6">Preguntas reales de compañeros, orientadas gratis. Son guías generales — no conceptos, documentos ni representación.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {items.slice(0, 9).map((c) => {
          const colors = CATEGORY_COLORS[c.area] || CATEGORY_COLORS["Disciplinarios"];
          return (
            <button key={c.id} onClick={() => setSelected(c)}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-oro/30 transition-all text-left group h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>{c.area}</span>
                <span className="text-green-600 text-[10px] font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Resuelta</span>
              </div>
              <h3 className="text-gray-900 font-bold text-sm leading-snug mb-2 group-hover:text-jungle-dark transition-colors">
                {c.pregunta.length > 110 ? c.pregunta.slice(0, 107) + "..." : c.pregunta}
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 flex-1">{c.respuesta}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-gray-400 text-[10px]">{c.nombre} · {c.respondido_por}</span>
                <span className="text-oro text-xs font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all">Ver <ChevronRight className="w-3.5 h-3.5" /></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-[8vh] overflow-y-auto" onClick={() => setSelected(null)}>
          <article className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="text-green-600 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Consulta resuelta</span>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Pregunta de {selected.nombre}</p>
                <p className="text-gray-900 text-sm sm:text-base leading-relaxed">{selected.pregunta}</p>
              </div>
              <div className="mb-5">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Respuesta de {selected.respondido_por}</p>
                <div className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">{selected.respuesta}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
                <p className="text-amber-800 text-[11px]"><strong>Orientación general.</strong> No es un concepto jurídico, ni un documento, ni una representación legal. Para llevar tu caso, conoce nuestros planes.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#consultar" onClick={() => setSelected(null)} className="flex-1 bg-jungle-dark text-white text-sm font-bold py-3 rounded-xl text-center hover:bg-jungle-dark/90 transition-colors">Hacer mi consulta gratis</a>
                <a href={SHARE_URL} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366] text-white text-sm font-bold py-3 rounded-xl text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2"><Share2 className="w-4 h-4" /> Compartir</a>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

// ── Cómo funciona ──────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { icon: HelpCircle, t: "1. Escribe tu pregunta", d: "Cuéntanos tu situación legal. Militar, policial, disciplinaria, pensional o familiar." },
    { icon: Lock, t: "2. Verifica tu correo", d: "Te enviamos un código para confirmar que eres tú. Tus datos quedan protegidos." },
    { icon: Scale, t: "3. Un abogado te orienta", d: "Un especialista te envía una orientación a tu correo, gratis y en ~8h. Es una guía, no un concepto, documento ni representación." },
  ];
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="grid sm:grid-cols-3 gap-4">
        {steps.map((s) => (
          <div key={s.t} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-10 h-10 bg-oro/10 rounded-xl flex items-center justify-center mb-3">
              <s.icon className="w-5 h-5 text-oro" />
            </div>
            <p className="text-gray-900 font-bold text-sm mb-1">{s.t}</p>
            <p className="text-gray-500 text-xs leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Página ─────────────────────────────────────────────────────────
export default function BlogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [resueltas, setResueltas] = useState(0);

  const onCount = useCallback((n: number) => setResueltas(n), []);

  const filtered = useMemo(() => {
    return BLOG_ARTICLES.filter((a) => {
      if (category && a.categoria !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.pregunta.toLowerCase().includes(q) || a.respuesta.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, category]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const catCounts = useMemo(() => {
    const c: Record<string, number> = {};
    BLOG_ARTICLES.forEach((a) => { c[a.categoria] = (c[a.categoria] || 0) + 1; });
    return c;
  }, []);

  return (
    <div className="min-h-screen bg-arena pt-16 sm:pt-20">
      {/* ═══ HERO — la consulta como protagonista ═══ */}
      <div className="relative bg-jungle-dark overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #C8A96E 0%, transparent 40%), radial-gradient(circle at 80% 70%, #C8A96E 0%, transparent 40%)" }} />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Izquierda: mensaje */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-oro/20 rounded-full px-3 py-1 mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-oro" />
                <span className="text-beige/80 text-[11px] sm:text-xs font-medium">Hecho por y para la Fuerza Pública de Colombia</span>
              </div>
              <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.05] mb-4">
                Un abogado experto te responde. <span className="text-oro">Gratis.</span>
              </h1>
              <p className="text-beige/60 text-sm sm:text-base leading-relaxed mb-6 max-w-lg">
                ¿Proceso disciplinario, penal militar, pensión, ascenso o un tema de familia?
                Escribe tu consulta y un abogado especializado en derecho militar y policial te da
                una <strong className="text-white">orientación clara</strong> a tu correo — gratis y confidencial.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {[
                  { icon: CheckCircle2, t: "100% gratis" },
                  { icon: Clock, t: "Respuesta en ~8h" },
                  { icon: Lock, t: "Confidencial" },
                  { icon: Scale, t: "Abogados especializados" },
                ].map((b) => (
                  <span key={b.t} className="flex items-center gap-1.5 text-beige/70 text-xs sm:text-sm">
                    <b.icon className="w-4 h-4 text-oro flex-shrink-0" /> {b.t}
                  </span>
                ))}
              </div>

              {/* Stat social proof */}
              {resueltas > 0 && (
                <div className="mt-6 inline-flex items-center gap-2 text-beige/50 text-xs">
                  <span className="flex -space-x-1.5">
                    {[0, 1, 2].map((i) => <span key={i} className="w-5 h-5 rounded-full bg-oro/30 border border-jungle-dark" />)}
                  </span>
                  <span><strong className="text-oro">{resueltas}+</strong> consultas ya resueltas para compañeros</span>
                </div>
              )}

              {/* Aclaración: es orientativa */}
              <div className="mt-5 bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 max-w-lg">
                <p className="text-beige/55 text-[11px] leading-relaxed">
                  <strong className="text-beige/90">Es una orientación gratuita:</strong> una guía general para que sepas cómo actuar. <strong className="text-beige/90">No</strong> es un concepto jurídico, <strong className="text-beige/90">ni</strong> un documento, <strong className="text-beige/90">ni</strong> una representación legal.
                </p>
              </div>
            </div>

            {/* Derecha: formulario */}
            <div className="lg:pl-4">
              <ConsultaForm />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Cómo funciona ═══ */}
      <HowItWorks />

      {/* ═══ Consultas resueltas (comunidad) ═══ */}
      <CommunityFeed onCount={onCount} />

      {/* ═══ Guía legal (base de conocimiento) ═══ */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-oro" />
          <h2 className="text-gray-900 text-xl sm:text-2xl font-black">Guía legal militar</h2>
        </div>
        <p className="text-gray-500 text-sm mb-5">Respuestas claras a las dudas legales más comunes de militares y policías.</p>

        {/* Búsqueda */}
        <div className="relative max-w-xl mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por tema: pensión, ascenso, sanción..."
            className="w-full bg-white border border-gray-200 text-gray-900 text-sm pl-12 pr-4 py-3 rounded-xl placeholder-gray-400 focus:outline-none focus:border-oro focus:ring-2 focus:ring-oro/10 transition-all" />
        </div>

        {/* Categorías */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => { setCategory(""); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all ${!category ? "bg-jungle-dark text-white border-jungle-dark" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
            Todas ({BLOG_ARTICLES.length})
          </button>
          {BLOG_CATEGORIES.map((cat) => {
            const colors = CATEGORY_COLORS[cat];
            return (
              <button key={cat} onClick={() => { setCategory(category === cat ? "" : cat); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all ${category === cat ? `${colors.bg} ${colors.text} ${colors.border}` : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
                {cat} ({catCounts[cat] || 0})
              </button>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {paginated.map((article) => {
            const colors = CATEGORY_COLORS[article.categoria] || CATEGORY_COLORS["Disciplinarios"];
            return (
              <Link key={article.id} href={`/blog/${article.slug}`}>
                <article className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 hover:shadow-md hover:border-oro/30 transition-all h-full flex flex-col group">
                  <span className={`self-start text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full border mb-3 ${colors.bg} ${colors.text} ${colors.border}`}>{article.categoria}</span>
                  <h3 className="text-gray-900 font-bold text-sm sm:text-[15px] leading-snug mb-2 group-hover:text-jungle-dark transition-colors">{article.pregunta}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-3 flex-1">{article.respuesta}</p>
                  <div className="flex items-center gap-1 mt-3 text-oro text-xs font-semibold group-hover:gap-2 transition-all">Leer más <ChevronRight className="w-3.5 h-3.5" /></div>
                </article>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No se encontraron artículos</p>
            <button onClick={() => { setSearch(""); setCategory(""); }} className="text-oro text-sm mt-2 hover:underline">Ver todos</button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === p ? "bg-jungle-dark text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-oro/30"}`}>{p}</button>
            ))}
          </div>
        )}
      </section>

      {/* ═══ Banner viral ═══ */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="bg-jungle-dark rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-oro/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Share2 className="w-6 h-6 text-oro" />
            </div>
            <div>
              <p className="text-white font-bold text-base sm:text-lg">Un compañero también lo necesita</p>
              <p className="text-beige/60 text-sm">Comparte la consulta gratis con tu unidad, tu compañía o tu grupo.</p>
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a href={SHARE_URL} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Share2 className="w-4 h-4" /> Compartir por WhatsApp
            </a>
            <a href={`${WA}?text=${encodeURIComponent("Hola, tengo una consulta legal")}`} target="_blank" rel="noopener noreferrer" className="bg-white/10 border border-white/15 text-white font-medium text-sm px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-white/15 transition-colors">
              Escríbenos <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
