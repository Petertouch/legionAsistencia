"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BLOG_ARTICLES, BLOG_CATEGORIES, CATEGORY_COLORS } from "@/lib/blog-data";
import { useQuestionsStore } from "@/lib/stores/questions-store";
import { Search, Scale, ChevronRight, BookOpen, Send, CheckCircle2, Clock, MessageCircle } from "lucide-react";

const ITEMS_PER_PAGE = 12;

const RAMAS = ["Ejército", "Policía", "Armada", "Fuerza Aérea"];
const AREAS_CONSULTA = ["Disciplinarios", "Penal Militar", "Derechos Laborales", "Ascensos y Carrera", "Salud y Pensión", "Familia", "Documentos Legales", "Retiro y Pensión", "Otro"];

function QuestionForm() {
  const { addPregunta, preguntas } = useQuestionsStore();
  const [form, setForm] = useState({ nombre: "", telefono: "", rama: "", area: "", pregunta: "" });
  const [sent, setSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration safe
  useState(() => { setMounted(true); });

  const canSend = form.nombre.trim() && form.telefono.trim() && form.pregunta.trim().length >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    addPregunta({
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      rama: form.rama || "No especificada",
      area: form.area || "General",
      pregunta: form.pregunta.trim(),
    });
    setForm({ nombre: "", telefono: "", rama: "", area: "", pregunta: "" });
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  // Show recent answered questions
  const respondidas = mounted ? preguntas.filter((p) => p.estado === "respondida").slice(0, 3) : [];

  return (
    <section className="bg-jungle-dark rounded-2xl overflow-hidden">
      <div className="grid lg:grid-cols-2">
        {/* Form */}
        <div className="p-5 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-5 h-5 text-oro" />
            <h2 className="text-white text-lg sm:text-xl font-bold">Haz tu consulta legal gratis</h2>
          </div>
          <p className="text-beige/50 text-xs sm:text-sm mb-5">
            Escribe tu pregunta y nuestro equipo de abogados te responde en un promedio de <strong className="text-oro">8 horas</strong>. 
            Cualquier tema, cualquier área. Sin compromiso.
          </p>

          {sent ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h3 className="text-white font-bold text-sm mb-1">¡Pregunta enviada!</h3>
              <p className="text-beige/50 text-xs">
                Nuestro equipo la revisará y te responderemos por WhatsApp en promedio 8 horas.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Tu nombre y rango *"
                  className="bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40"
                />
                <input
                  type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="WhatsApp / Celular *"
                  className="bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.rama} onChange={(e) => setForm({ ...form, rama: e.target.value })}
                  className="bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
                  <option value="" className="bg-jungle-dark">Rama (opcional)</option>
                  {RAMAS.map((r) => <option key={r} value={r} className="bg-jungle-dark">{r}</option>)}
                </select>
                <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
                  <option value="" className="bg-jungle-dark">Área (opcional)</option>
                  {AREAS_CONSULTA.map((a) => <option key={a} value={a} className="bg-jungle-dark">{a}</option>)}
                </select>
              </div>
              <textarea
                value={form.pregunta} onChange={(e) => setForm({ ...form, pregunta: e.target.value })}
                placeholder="Describe tu situación o pregunta legal... (mínimo 10 caracteres) *"
                rows={3}
                className="w-full bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40 resize-none"
              />
              <button
                type="submit" disabled={!canSend}
                className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-oro/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Enviar mi consulta
              </button>
              <p className="text-beige/30 text-[10px] text-center">
                Tu información es confidencial. Solo la usamos para responderte.
              </p>
            </form>
          )}
        </div>

        {/* Recent answered */}
        <div className="bg-white/5 p-5 sm:p-8 border-t lg:border-t-0 lg:border-l border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-oro" />
            <h3 className="text-white font-bold text-sm">Consultas respondidas recientemente</h3>
          </div>
          {respondidas.length > 0 ? (
            <div className="space-y-3">
              {respondidas.map((p) => (
                <div key={p.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-beige/40 text-[10px]">{p.rama}</span>
                    <span className="text-beige/20 text-[10px]">•</span>
                    <span className="text-beige/40 text-[10px]">{p.area}</span>
                  </div>
                  <p className="text-white text-xs font-medium mb-1.5 leading-snug">{p.pregunta}</p>
                  <p className="text-beige/50 text-[11px] leading-relaxed line-clamp-3">{p.respuesta}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 text-[9px] font-medium">
                      Respondida {p.responded_at ? `el ${new Date(p.responded_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-white text-xs font-medium mb-1.5">¿Qué tan grave es llegar tarde a formación?</p>
                <p className="text-beige/50 text-[11px] leading-relaxed line-clamp-3">Depende del reglamento interno y las circunstancias. Puede ser falta leve o grave...</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-[9px] font-medium">Respondida en 6 horas</span>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-white text-xs font-medium mb-1.5">¿Pueden descontarme sin autorización de mi sueldo?</p>
                <p className="text-beige/50 text-[11px] leading-relaxed line-clamp-3">No. Todo descuento debe estar autorizado por ley o por usted. Si le están descontando sin su consentimiento...</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-[9px] font-medium">Respondida en 4 horas</span>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-white/5 text-center">
            <p className="text-beige/30 text-[10px]">Tiempo promedio de respuesta</p>
            <p className="text-oro font-bold text-lg">~8 horas</p>
          </div>
        </div>
      </div>
    </section>
  );
}

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

  const handleCategoryClick = (cat: string) => {
    setCategory(category === cat ? "" : cat);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-arena pt-20 sm:pt-24">
      {/* Hero */}
      <div className="bg-jungle-dark py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-oro" />
            <h1 className="text-white text-2xl sm:text-4xl font-black">Guía Legal Militar</h1>
          </div>
          <p className="text-beige/60 text-sm sm:text-base max-w-2xl mb-6 sm:mb-8">
            Respuestas claras a las preguntas legales más comunes de militares y policías en Colombia. 
            100 artículos escritos por abogados especialistas.
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-beige/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por tema, palabra clave..."
              className="w-full bg-white/10 border border-white/15 text-white text-sm sm:text-base pl-12 pr-4 py-3 sm:py-3.5 rounded-xl placeholder-beige/30 focus:outline-none focus:border-oro/50 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Ask your question */}
        <div className="mb-8 sm:mb-10">
          <QuestionForm />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
          <button
            onClick={() => { setCategory(""); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all ${
              !category
                ? "bg-jungle-dark text-white border-jungle-dark"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            Todas ({BLOG_ARTICLES.length})
          </button>
          {BLOG_CATEGORIES.map((cat) => {
            const colors = CATEGORY_COLORS[cat];
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all ${
                  active
                    ? `${colors.bg} ${colors.text} ${colors.border}`
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {cat} ({catCounts[cat] || 0})
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <p className="text-gray-400 text-xs sm:text-sm mb-4">
          {filtered.length} {filtered.length === 1 ? "artículo" : "artículos"}
          {category && <span> en <strong className="text-gray-600">{category}</strong></span>}
          {search && <span> para &quot;<strong className="text-gray-600">{search}</strong>&quot;</span>}
        </p>

        {/* Grid */}
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

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No se encontraron artículos</p>
            <button onClick={() => { setSearch(""); setCategory(""); }} className="text-oro text-sm mt-2 hover:underline">
              Ver todos los artículos
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  page === p
                    ? "bg-jungle-dark text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-oro/30"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
