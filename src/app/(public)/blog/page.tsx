"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BLOG_ARTICLES, BLOG_CATEGORIES, CATEGORY_COLORS } from "@/lib/blog-data";
import { Search, Scale, ChevronRight, BookOpen } from "lucide-react";

const ITEMS_PER_PAGE = 12;

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

  // Category counts
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

        {/* CTA */}
        <div className="mt-10 sm:mt-14 bg-jungle-dark rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-white text-lg sm:text-xl font-bold mb-2">
            ¿Necesitas un abogado que te defienda?
          </h3>
          <p className="text-beige/50 text-xs sm:text-sm mb-5 max-w-md mx-auto">
            Nuestro equipo de abogados especialistas en derecho militar está listo para ayudarte. 
            Planes desde $50.000/mes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/573176689580?text=Hola%2C%20vengo%20de%20la%20gu%C3%ADa%20legal.%20Necesito%20asesor%C3%ADa."
              target="_blank"
              className="bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold px-6 py-3 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-oro/20"
            >
              Hablar con un abogado
            </a>
            <a href="/#planes" className="text-beige/50 hover:text-white text-sm transition-colors">
              Ver planes →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
