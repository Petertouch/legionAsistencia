import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BLOG_ARTICLES, CATEGORY_COLORS, getArticleBySlug, getRelatedArticles } from "@/lib/blog-data";
import { ArrowLeft, ChevronRight, Scale, MessageCircle, Phone } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate all static paths
export async function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));
}

// Dynamic SEO metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const title = article.pregunta.replace(/^¿/, "").replace(/\?$/, "");
  return {
    title,
    description: article.respuesta.slice(0, 160),
    openGraph: {
      title: `${article.pregunta} — Legión Jurídica`,
      description: article.respuesta.slice(0, 160),
      type: "article",
      url: `https://legionjuridica.com/blog/${slug}`,
    },
    alternates: {
      canonical: `https://legionjuridica.com/blog/${slug}`,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article, 4);
  const colors = CATEGORY_COLORS[article.categoria] || CATEGORY_COLORS["Disciplinarios"];

  // JSON-LD for this article
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.pregunta,
    description: article.respuesta.slice(0, 160),
    author: { "@type": "Organization", name: "Legión Jurídica" },
    publisher: {
      "@type": "Organization",
      name: "Legión Jurídica",
      logo: { "@type": "ImageObject", url: "https://legionjuridica.com/images/logo.svg" },
    },
    mainEntityOfPage: `https://legionjuridica.com/blog/${slug}`,
    articleSection: article.categoria,
  };

  // FAQ schema
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: article.pregunta,
        acceptedAnswer: { "@type": "Answer", text: article.respuesta },
      },
    ],
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://legionjuridica.com" },
      { "@type": "ListItem", position: 2, name: "Guía Legal", item: "https://legionjuridica.com/blog" },
      {
        "@type": "ListItem",
        position: 3,
        name: article.categoria,
        item: `https://legionjuridica.com/blog?cat=${encodeURIComponent(article.categoria)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: article.pregunta,
        item: `https://legionjuridica.com/blog/${slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-arena pt-20 sm:pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/blog" className="hover:text-gray-600 transition-colors">Guía Legal</Link>
          <ChevronRight className="w-3 h-3" />
          <span className={`${colors.text} font-medium`}>{article.categoria}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_280px] gap-6 sm:gap-8">
          {/* Main content */}
          <article>
            <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border mb-4 ${colors.bg} ${colors.text} ${colors.border}`}>
              {article.categoria}
            </span>

            <h1 className="text-gray-900 text-xl sm:text-3xl font-black leading-tight mb-6">
              {article.pregunta}
            </h1>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-oro" />
                <span className="text-gray-500 text-xs font-medium">Respuesta de nuestro equipo legal</span>
              </div>
              <div className="text-gray-700 text-sm sm:text-base leading-relaxed sm:leading-7">
                {article.respuesta.split(". ").map((sentence, i, arr) => (
                  <p key={i} className={i < arr.length - 1 ? "mb-3" : ""}>
                    {sentence}{i < arr.length - 1 ? "." : ""}
                  </p>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-amber-800 text-[11px] sm:text-xs leading-relaxed">
                <strong>Nota:</strong> Esta información es orientativa y no constituye asesoría legal formal. 
                Cada caso es único. Para una evaluación personalizada de tu situación, consulta con un abogado de nuestro equipo.
              </p>
            </div>

            {/* CTA inline */}
            <div className="mt-6 bg-jungle-dark rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm sm:text-base mb-1">
                  ¿Tienes este problema?
                </h3>
                <p className="text-beige/50 text-xs sm:text-sm">
                  Nuestros abogados especialistas pueden ayudarte. Escríbenos y te orientamos sin compromiso.
                </p>
              </div>
              <a
                href={`https://wa.me/573176689580?text=Hola%2C%20tengo%20una%20consulta%20sobre%3A%20${encodeURIComponent(article.pregunta)}`}
                target="_blank"
                className="bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold px-5 py-2.5 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-oro/20 whitespace-nowrap flex-shrink-0"
              >
                Consultar gratis
              </a>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className="mt-8 sm:mt-10">
                <h3 className="text-gray-900 font-bold text-base sm:text-lg mb-4">
                  Preguntas relacionadas
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {related.map((rel) => (
                    <Link key={rel.id} href={`/blog/${rel.slug}`}>
                      <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-oro/30 transition-all group">
                        <h4 className="text-gray-900 font-semibold text-sm leading-snug mb-1.5 group-hover:text-jungle-dark transition-colors">
                          {rel.pregunta}
                        </h4>
                        <p className="text-gray-400 text-xs line-clamp-2">{rel.respuesta}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back */}
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-gray-400 text-sm mt-6 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Ver todas las preguntas
            </Link>
          </article>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* WhatsApp */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <h4 className="text-gray-900 font-bold text-sm">¿Necesitas ayuda?</h4>
              </div>
              <p className="text-gray-500 text-xs mb-3 leading-relaxed">
                Escríbenos por WhatsApp y un abogado te orientará sin compromiso.
              </p>
              <a
                href="https://wa.me/573176689580?text=Hola%2C%20vengo%20de%20la%20gu%C3%ADa%20legal.%20Necesito%20asesor%C3%ADa."
                target="_blank"
                className="block w-full bg-[#25D366] text-white text-center text-sm font-bold py-2.5 rounded-lg hover:bg-[#20BD5A] transition-colors"
              >
                Escribir por WhatsApp
              </a>
            </div>

            {/* Planes */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <h4 className="text-gray-900 font-bold text-sm mb-2">Planes de suscripción</h4>
              <p className="text-gray-500 text-xs mb-3 leading-relaxed">
                Asesoría jurídica ilimitada para ti y tu familia desde $50.000/mes.
              </p>
              <a
                href="/#planes"
                className="block w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark text-center text-sm font-bold py-2.5 rounded-lg transition-all active:scale-95"
              >
                Ver planes
              </a>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-gray-400" />
                <h4 className="text-gray-900 font-bold text-sm">Llámanos</h4>
              </div>
              <a href="tel:+573176689580" className="text-oro text-sm font-medium hover:underline">
                317 668 9580
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
