"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { BLOG_ARTICLES, BLOG_CATEGORIES, CATEGORY_COLORS } from "@/lib/blog-data";
import { MOCK_CASOS, MOCK_SUSCRIPTORES } from "@/lib/mock-data";
import {
  useQuestionsStore,
  registerFreeSuscriptor,
  createConsultaCaso,
  setBlogPassword,
  verifyBlogPassword,
  getAnsweredConsultas,
  syncPersistedData,
} from "@/lib/stores/questions-store";

// Sync persisted consultas on load
syncPersistedData();
import {
  Search, Scale, ChevronRight, BookOpen, Send, CheckCircle2,
  Clock, MessageCircle, LogIn, UserPlus, EyeOff, Eye, LogOut,
} from "lucide-react";

const ITEMS_PER_PAGE = 12;
const RAMAS = ["Ejército", "Policía", "Armada", "Fuerza Aérea"];
const AREAS_CONSULTA = ["Disciplinarios", "Penal Militar", "Derechos Laborales", "Ascensos y Carrera", "Salud y Pensión", "Familia", "Documentos Legales", "Retiro y Pensión", "Otro"];

// ── Registration / Login / Question Form ────────────────────────
function ConsultaSection() {
  const { blogUser, loginBlog, logoutBlog } = useQuestionsStore();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"idle" | "login" | "register">("idle");
  const [sent, setSent] = useState(false);

  // Login form
  const [loginCedula, setLoginCedula] = useState("");
  const [loginClave, setLoginClave] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register form
  const [reg, setReg] = useState({ nombre: "", telefono: "", email: "", cedula: "", clave: "", rama: "", rango: "" });
  const [regError, setRegError] = useState("");

  // Question form
  const [pregunta, setPregunta] = useState("");
  const [area, setArea] = useState("");
  const [anonimo, setAnonimo] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginCedula.trim() || !loginClave.trim()) return;

    // Check if suscriptor exists
    const sus = MOCK_SUSCRIPTORES.find((s) => s.cedula === loginCedula.trim());
    if (!sus) { setLoginError("Cédula no registrada. Regístrate primero."); return; }
    if (!verifyBlogPassword(loginCedula.trim(), loginClave.trim())) { setLoginError("Clave incorrecta"); return; }

    loginBlog({ suscriptor_id: sus.id, nombre: sus.nombre, cedula: sus.cedula, email: sus.email });
    setMode("idle");
    setLoginCedula("");
    setLoginClave("");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!reg.nombre.trim() || !reg.cedula.trim() || !reg.email.trim() || !reg.clave.trim()) {
      setRegError("Completa todos los campos obligatorios"); return;
    }
    if (reg.clave.length < 4) { setRegError("La clave debe tener al menos 4 caracteres"); return; }

    // Check if cedula already exists
    const existing = MOCK_SUSCRIPTORES.find((s) => s.cedula === reg.cedula.trim());
    if (existing) { setRegError("Esta cédula ya está registrada. Inicia sesión."); return; }

    const sus = registerFreeSuscriptor({
      nombre: reg.nombre.trim(),
      telefono: reg.telefono.trim(),
      email: reg.email.trim(),
      cedula: reg.cedula.trim(),
      rama: reg.rama || "No especificada",
      rango: reg.rango || "No especificado",
    });

    setBlogPassword(reg.cedula.trim(), reg.clave);
    loginBlog({ suscriptor_id: sus.id, nombre: sus.nombre, cedula: sus.cedula, email: sus.email });
    setMode("idle");
    setReg({ nombre: "", telefono: "", email: "", cedula: "", clave: "", rama: "", rango: "" });
  };

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogUser || pregunta.trim().length < 10) return;

    const sus = MOCK_SUSCRIPTORES.find((s) => s.id === blogUser.suscriptor_id);
    if (!sus) return;

    createConsultaCaso({
      suscriptor: sus,
      pregunta: pregunta.trim(),
      area: area || "General",
      anonimo,
      email: blogUser.email,
    });

    setPregunta("");
    setArea("");
    setAnonimo(false);
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  const isLoggedIn = mounted && blogUser;

  return (
    <section className="bg-jungle-dark rounded-2xl overflow-hidden">
      <div className="p-5 sm:p-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-oro" />
            <h2 className="text-white text-lg sm:text-xl font-bold">Haz tu consulta legal gratis</h2>
          </div>
          {isLoggedIn && (
            <button onClick={() => logoutBlog()} className="flex items-center gap-1 text-beige/30 text-[10px] hover:text-white transition-colors">
              <LogOut className="w-3 h-3" /> Salir
            </button>
          )}
        </div>
        <p className="text-beige/50 text-xs sm:text-sm mb-5">
          Nuestro equipo de abogados responde en un promedio de <strong className="text-oro">8 horas</strong>. 
          Cualquier tema, cualquier área. La respuesta es orientativa y confidencial.
          {!isLoggedIn && " Regístrate con tu cédula para hacer tu consulta."}
        </p>

        {/* Not logged in — show login/register */}
        {!isLoggedIn && mode === "idle" && (
          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={() => setMode("login")}
              className="flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white py-3 rounded-xl text-sm font-medium hover:bg-white/15 transition-all">
              <LogIn className="w-4 h-4" /> Ya tengo cuenta
            </button>
            <button onClick={() => setMode("register")}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-oro to-oro-light text-jungle-dark py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-oro/20">
              <UserPlus className="w-4 h-4" /> Registrarme gratis
            </button>
          </div>
        )}

        {/* Login form */}
        {!isLoggedIn && mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-3 max-w-sm">
            <input type="text" value={loginCedula} onChange={(e) => setLoginCedula(e.target.value)}
              placeholder="Tu cédula" className="w-full bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
            <input type="password" value={loginClave} onChange={(e) => setLoginClave(e.target.value)}
              placeholder="Tu clave" className="w-full bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
            {loginError && <p className="text-red-400 text-xs">{loginError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setMode("idle"); setLoginError(""); }}
                className="text-beige/40 text-sm hover:text-white transition-colors">Cancelar</button>
              <button type="submit"
                className="flex-1 bg-gradient-to-r from-oro to-oro-light text-jungle-dark py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98]">
                Ingresar
              </button>
            </div>
            <button type="button" onClick={() => { setMode("register"); setLoginError(""); }}
              className="text-oro text-xs hover:underline">¿No tienes cuenta? Regístrate</button>
          </form>
        )}

        {/* Register form */}
        {!isLoggedIn && mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={reg.nombre} onChange={(e) => setReg({ ...reg, nombre: e.target.value })}
                placeholder="Nombre y rango *" className="bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
              <input type="text" value={reg.cedula} onChange={(e) => setReg({ ...reg, cedula: e.target.value })}
                placeholder="Cédula (tu usuario) *" className="bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })}
                placeholder="Email *" className="bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
              <input type="tel" value={reg.telefono} onChange={(e) => setReg({ ...reg, telefono: e.target.value })}
                placeholder="WhatsApp / Celular" className="bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={reg.rama} onChange={(e) => setReg({ ...reg, rama: e.target.value })}
                className="bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
                <option value="" className="bg-jungle-dark">Rama</option>
                {RAMAS.map((r) => <option key={r} value={r} className="bg-jungle-dark">{r}</option>)}
              </select>
              <input type="text" value={reg.rango} onChange={(e) => setReg({ ...reg, rango: e.target.value })}
                placeholder="Rango" className="bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
            </div>
            <input type="password" value={reg.clave} onChange={(e) => setReg({ ...reg, clave: e.target.value })}
              placeholder="Crea tu clave (mín. 4 caracteres) *" className="w-full bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
            {regError && <p className="text-red-400 text-xs">{regError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setMode("idle"); setRegError(""); }}
                className="text-beige/40 text-sm hover:text-white transition-colors">Cancelar</button>
              <button type="submit"
                className="flex-1 bg-gradient-to-r from-oro to-oro-light text-jungle-dark py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98]">
                Crear cuenta gratis
              </button>
            </div>
            <button type="button" onClick={() => { setMode("login"); setRegError(""); }}
              className="text-oro text-xs hover:underline">¿Ya tienes cuenta? Inicia sesión</button>
            <p className="text-beige/25 text-[10px]">Tu cédula es tu usuario único. Tus datos son confidenciales.</p>
          </form>
        )}

        {/* Logged in — show question form */}
        {isLoggedIn && !sent && (
          <form onSubmit={handleSubmitQuestion} className="space-y-3">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
              <span className="text-beige/40 text-xs">Consultando como:</span>
              <span className="text-white text-xs font-medium">{blogUser!.nombre}</span>
              <span className="text-beige/20 text-xs">• CC {blogUser!.cedula}</span>
            </div>

            <textarea
              value={pregunta} onChange={(e) => setPregunta(e.target.value)}
              placeholder="Describe tu situación o pregunta legal... (mín. 10 caracteres)"
              rows={3}
              className="w-full bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40 resize-none"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <select value={area} onChange={(e) => setArea(e.target.value)}
                className="sm:w-48 bg-white/10 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
                <option value="" className="bg-jungle-dark">Área (opcional)</option>
                {AREAS_CONSULTA.map((a) => <option key={a} value={a} className="bg-jungle-dark">{a}</option>)}
              </select>

              <button type="button" onClick={() => setAnonimo(!anonimo)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                  anonimo ? "bg-purple-500/15 border-purple-500/30 text-purple-300" : "bg-white/5 border-white/10 text-beige/40 hover:text-white"
                }`}>
                {anonimo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {anonimo ? "Consulta anónima" : "Publicar con mi nombre"}
              </button>
            </div>

            <button type="submit" disabled={pregunta.trim().length < 10}
              className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-oro/20 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Enviar mi consulta
            </button>

            <p className="text-beige/25 text-[10px] text-center">
              Tu consulta será revisada por un abogado antes de publicarse. Las respuestas son orientativas.
              {anonimo ? " Tu nombre no aparecerá públicamente." : " Tu nombre será visible en la publicación."}
            </p>
          </form>
        )}

        {/* Sent confirmation */}
        {isLoggedIn && sent && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="text-white font-bold text-sm mb-1">¡Consulta enviada!</h3>
            <p className="text-beige/50 text-xs">
              Un abogado la revisará y responderá en promedio 8 horas. 
              Recibirás la respuesta en tu email con un link para verla aquí.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Answered questions from the community ───────────────────────
function CommunityAnswers() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const answered = getAnsweredConsultas();
  if (answered.length === 0) return null;

  return (
    <div className="mb-8 sm:mb-10">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <h2 className="text-gray-900 text-lg font-bold">Consultas respondidas por nuestros abogados</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {answered.map((c) => {
          // Extract response from notas_etapa (abogado writes there)
          const respuesta = c.notas_etapa.split("\n---\n")[1] || c.notas_etapa;
          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-[10px]">{c.suscriptor_nombre}</span>
                <span className="text-green-600 text-[10px] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Respondida
                </span>
              </div>
              <h3 className="text-gray-900 font-bold text-sm leading-snug mb-2">{c.descripcion.length > 120 ? c.descripcion.slice(0, 117) + "..." : c.descripcion}</h3>
              <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{respuesta}</p>
              <p className="text-gray-300 text-[9px] mt-2">
                Respondida por {c.abogado} • {new Date(c.updated_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
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
          <div className="flex items-center gap-3 mb-3">
            <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-oro" />
            <h1 className="text-white text-2xl sm:text-4xl font-black">Guía Legal Militar</h1>
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
        {/* Question form */}
        <div className="mb-8 sm:mb-10">
          <ConsultaSection />
        </div>

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
