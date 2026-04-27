"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { BLOG_ARTICLES, BLOG_CATEGORIES, CATEGORY_COLORS } from "@/lib/blog-data";
import {
  getAnsweredConsultas,
  syncPersistedData,
} from "@/lib/stores/questions-store";
import {
  Search, ChevronRight, BookOpen, Send, CheckCircle2,
  MessageCircle, Scale,
} from "lucide-react";

const ITEMS_PER_PAGE = 12;

// ── Registration / Login / Question Form ────────────────────────
function ConsultaSection() {
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

  const inputCls = "w-full bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40";

  return (
    <section className="bg-jungle-dark rounded-2xl overflow-hidden">
      <div className="p-5 sm:p-8">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="w-5 h-5 text-oro" />
          <h2 className="text-white text-lg sm:text-xl font-bold">Consulta legal gratuita</h2>
        </div>
        <p className="text-beige/50 text-xs sm:text-sm mb-5">
          Nuestro equipo de abogados responde en un promedio de <strong className="text-oro">8 horas</strong>.
          La respuesta es orientativa, confidencial y llega directo a tu correo.
        </p>

        {/* Step 1: Form */}
        {step === "form" && (
          <form onSubmit={handleSendCode} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre *" className={inputCls} required />
              <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Apellido *" className={inputCls} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))} placeholder="Teléfono / WhatsApp *" inputMode="numeric" className={inputCls} required />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico *" className={inputCls} required />
            </div>
            <textarea value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="Describe tu situación o pregunta legal... *" rows={4} className={`${inputCls} resize-none`} required />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-oro/20 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-jungle-dark/30 border-t-jungle-dark rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "Enviando código..." : "Enviar consulta"}
            </button>
            <p className="text-beige/25 text-[10px] text-center">Te enviaremos un código al correo para verificar tu identidad.</p>
          </form>
        )}

        {/* Step 2: Code verification */}
        {step === "code" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-white text-sm mb-1">Enviamos un código de 6 dígitos a</p>
              <p className="text-oro font-bold text-sm">{email}</p>
              <p className="text-beige/40 text-[10px] mt-1">Revisa tu bandeja de entrada y spam</p>
            </div>
            {/* 6 digit boxes */}
            <div className="flex justify-center gap-2 sm:gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (!val && e.nativeEvent instanceof InputEvent && e.nativeEvent.inputType === "deleteContentBackward") {
                        const newCode = code.slice(0, i) + code.slice(i + 1);
                        setCode(newCode);
                        const prev = e.target.previousElementSibling as HTMLInputElement | null;
                        if (prev) prev.focus();
                        return;
                      }
                      if (!val) return;
                      const newCode = code.slice(0, i) + val[0] + code.slice(i + 1);
                      setCode(newCode.slice(0, 6));
                      const next = e.target.nextElementSibling as HTMLInputElement | null;
                      if (next && val) next.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !code[i]) {
                        const prev = (e.target as HTMLElement).previousElementSibling as HTMLInputElement | null;
                        if (prev) prev.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      if (pasted) setCode(pasted);
                    }}
                    className={`w-11 h-14 sm:w-13 sm:h-16 bg-white rounded-xl border-2 text-center text-2xl sm:text-3xl font-black focus:outline-none transition-all ${
                      code[i] ? "border-oro text-gray-900" : "border-gray-200 text-gray-300"
                    } focus:border-oro focus:ring-2 focus:ring-oro/20`}
                    autoFocus={i === 0}
                  />
                  {!code[i] && (
                    <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-2xl font-bold pointer-events-none">—</span>
                  )}
                </div>
              ))}
            </div>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button type="submit" disabled={loading || code.length !== 6} className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-oro/20 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-jungle-dark/30 border-t-jungle-dark rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? "Verificando..." : "Verificar y enviar consulta"}
            </button>
            <button type="button" onClick={() => { setStep("form"); setCode(""); setError(""); }} className="text-beige/40 text-xs hover:text-white transition-colors block mx-auto">
              ← Volver al formulario
            </button>
          </form>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-base mb-2">¡Consulta recibida!</h3>
            <p className="text-beige/50 text-sm mb-4">
              Un abogado revisará tu caso y te enviaremos la respuesta a <strong className="text-white">{email}</strong> en un promedio de 8 horas.
            </p>
            <button onClick={() => { setStep("form"); setNombre(""); setApellido(""); setTelefono(""); setEmail(""); setArea(""); setPregunta(""); setCode(""); setError(""); }}
              className="text-oro text-sm font-medium hover:underline">
              Hacer otra consulta
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ConsultaToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-8 sm:mb-10">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full bg-jungle-dark hover:bg-jungle-dark/90 rounded-2xl p-5 sm:p-6 flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-oro/15 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-oro" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm sm:text-base">Consulta legal gratuita</p>
              <p className="text-beige/50 text-xs sm:text-sm">Un abogado responde tu pregunta en promedio 8 horas</p>
            </div>
          </div>
          <span className="bg-gradient-to-r from-oro to-oro-light text-jungle-dark text-xs sm:text-sm font-bold px-4 py-2 rounded-xl group-hover:scale-105 transition-transform">
            Hacer consulta
          </span>
        </button>
      ) : (
        <ConsultaSection />
      )}
    </div>
  );
}

// ── Answered questions from the community ───────────────────────
function CommunityAnswers() {
  const [mounted, setMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => { syncPersistedData(); setMounted(true); }, []);

  if (!mounted) return null;

  const answered = getAnsweredConsultas();
  if (answered.length === 0) return null;

  const selected = selectedId ? answered.find((c) => c.id === selectedId) : null;

  return (
    <>
      <div className="mb-8 sm:mb-10">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <h2 className="text-gray-900 text-lg font-bold">Consultas respondidas por nuestros abogados</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {answered.map((c) => {
            const respuesta = c.notas_etapa.split("\n---\n")[1] || c.notas_etapa;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 hover:shadow-md hover:border-oro/30 transition-all text-left group h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-[10px]">{c.suscriptor_nombre}</span>
                  <span className="text-green-600 text-[10px] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Respondida
                  </span>
                </div>
                <h3 className="text-gray-900 font-bold text-sm leading-snug mb-2 group-hover:text-jungle-dark transition-colors">
                  {c.descripcion.length > 120 ? c.descripcion.slice(0, 117) + "..." : c.descripcion}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 flex-1">{respuesta}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                  <p className="text-gray-300 text-[9px]">
                    {c.abogado} • {new Date(c.updated_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                  </p>
                  <span className="text-oro text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Leer más <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-[10vh] overflow-y-auto" onClick={() => setSelectedId(null)}>
          <article className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <span className="text-green-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                    <CheckCircle2 className="w-3 h-3" /> Consulta respondida
                  </span>
                  <span className="text-gray-400 text-xs">
                    {selected.suscriptor_nombre} • {new Date(selected.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none p-1">×</button>
              </div>

              {/* Question */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Pregunta</p>
                <p className="text-gray-900 text-sm sm:text-base leading-relaxed">{selected.descripcion}</p>
              </div>

              {/* Answer */}
              <div className="mb-6">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Respuesta de {selected.abogado}</p>
                <div className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {selected.notas_etapa.split("\n---\n")[1] || selected.notas_etapa}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <p className="text-amber-800 text-[11px]">
                  <strong>Nota:</strong> Esta respuesta es orientativa y no constituye asesoría legal formal. Para un seguimiento completo de tu caso, conoce nuestros planes.
                </p>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://wa.me/573176689580" target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-jungle-dark text-white text-sm font-bold py-3 rounded-xl text-center hover:bg-jungle-dark/90 transition-colors">
                  Hablar con un abogado
                </a>
                <button onClick={() => setSelectedId(null)}
                  className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-3 rounded-xl text-center hover:bg-gray-200 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </article>
        </div>
      )}
    </>
  );
}

// ── Main Blog Page ──────────────────────────────────────────────
export default function BlogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

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
    const counts: Record<string, number> = {};
    BLOG_ARTICLES.forEach((a) => { counts[a.categoria] = (counts[a.categoria] || 0) + 1; });
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-arena pt-20 sm:pt-24">
      {/* Hero */}
      <div className="bg-jungle-dark py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-oro" />
              <h1 className="text-white text-2xl sm:text-4xl font-black">Guía Legal Militar</h1>
            </div>
            <Link href="/noticias"
              className="flex items-center gap-1.5 bg-white/10 border border-white/10 text-beige/70 hover:text-oro hover:border-oro/30 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all">
              <BookOpen className="w-4 h-4" /> Noticias
            </Link>
          </div>
          <p className="text-beige/60 text-sm sm:text-base max-w-2xl mb-6 sm:mb-8">
            Respuestas claras a las preguntas legales más comunes de militares y policías en Colombia. 
            Haz tu propia consulta y un abogado te responde gratis.
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-beige/30" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por tema, palabra clave..."
              className="w-full bg-white/10 border border-white/15 text-white text-sm sm:text-base pl-12 pr-4 py-3 sm:py-3.5 rounded-xl placeholder-beige/30 focus:outline-none focus:border-oro/50 transition-colors" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Question form — toggle */}
        <ConsultaToggle />

        {/* Answered community questions */}
        <CommunityAnswers />

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
          <button onClick={() => { setCategory(""); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all ${
              !category ? "bg-jungle-dark text-white border-jungle-dark" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}>
            Todas ({BLOG_ARTICLES.length})
          </button>
          {BLOG_CATEGORIES.map((cat) => {
            const colors = CATEGORY_COLORS[cat];
            return (
              <button key={cat} onClick={() => { setCategory(category === cat ? "" : cat); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all ${
                  category === cat ? `${colors.bg} ${colors.text} ${colors.border}` : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}>
                {cat} ({catCounts[cat] || 0})
              </button>
            );
          })}
        </div>

        <p className="text-gray-400 text-xs sm:text-sm mb-4">
          {filtered.length} {filtered.length === 1 ? "artículo" : "artículos"}
          {category && <span> en <strong className="text-gray-600">{category}</strong></span>}
          {search && <span> para &quot;<strong className="text-gray-600">{search}</strong>&quot;</span>}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {paginated.map((article) => {
            const colors = CATEGORY_COLORS[article.categoria] || CATEGORY_COLORS["Disciplinarios"];
            return (
              <Link key={article.id} href={`/blog/${article.slug}`}>
                <article className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 hover:shadow-md hover:border-oro/30 transition-all h-full flex flex-col group">
                  <span className={`self-start text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full border mb-3 ${colors.bg} ${colors.text} ${colors.border}`}>
                    {article.categoria}
                  </span>
                  <h2 className="text-gray-900 font-bold text-sm sm:text-[15px] leading-snug mb-2 group-hover:text-jungle-dark transition-colors">
                    {article.pregunta}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-3 flex-1">
                    {article.respuesta}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-oro text-xs font-semibold group-hover:gap-2 transition-all">
                    Leer más <ChevronRight className="w-3.5 h-3.5" />
                  </div>
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
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  page === p ? "bg-jungle-dark text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-oro/30"
                }`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
