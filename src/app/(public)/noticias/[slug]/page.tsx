import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NOTICIAS, getNoticiaBySlug, CATEGORIA_COLORS } from "@/lib/noticias-data";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return NOTICIAS.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const noticia = getNoticiaBySlug(slug);
  if (!noticia) return { title: "No encontrado" };
  const url = `https://legionjuridica.com/noticias/${slug}`;
  return {
    title: `${noticia.titulo} | Legión Jurídica`,
    description: noticia.extracto,
    alternates: { canonical: url },
    openGraph: {
      title: noticia.titulo,
      description: noticia.extracto,
      type: "article",
      url,
      publishedTime: noticia.fecha,
      authors: [noticia.autor],
      images: [{ url: noticia.imagen, alt: noticia.titulo }],
    },
    twitter: {
      card: "summary_large_image",
      title: noticia.titulo,
      description: noticia.extracto,
      images: [noticia.imagen],
    },
  };
}

export default async function NoticiaDetailPage({ params }: Props) {
  const { slug } = await params;
  const noticia = getNoticiaBySlug(slug);
  if (!noticia) notFound();

  const cat = CATEGORIA_COLORS[noticia.categoria] ?? { bg: "bg-white/10", text: "text-white" };

  const url = `https://legionjuridica.com/noticias/${slug}`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: noticia.titulo,
    description: noticia.extracto,
    image: noticia.imagen.startsWith("http")
      ? noticia.imagen
      : `https://legionjuridica.com${noticia.imagen}`,
    datePublished: noticia.fecha,
    dateModified: noticia.fecha,
    author: { "@type": "Person", name: noticia.autor },
    publisher: {
      "@type": "Organization",
      name: "Legión Jurídica",
      logo: {
        "@type": "ImageObject",
        url: "https://legionjuridica.com/images/logo.svg",
      },
    },
    mainEntityOfPage: url,
    articleSection: noticia.categoria,
    inLanguage: "es-CO",
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://legionjuridica.com" },
      { "@type": "ListItem", position: 2, name: "Noticias", item: "https://legionjuridica.com/noticias" },
      { "@type": "ListItem", position: 3, name: noticia.titulo, item: url },
    ],
  };

  return (
    <article className="pt-20 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {/* Hero image */}
      <div className="relative w-full aspect-[21/9] max-h-[420px]">
        <Image
          src={noticia.imagen}
          alt={noticia.titulo}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-jungle-dark via-jungle-dark/40 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
            {noticia.categoria}
          </span>
          <span className="text-sm text-beige/40">
            {new Date(noticia.fecha).toLocaleDateString("es-CO", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="text-sm text-beige/30">·</span>
          <span className="text-sm text-beige/40">{noticia.autor}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-8">
          {noticia.titulo}
        </h1>

        <div
          className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-beige/70 prose-p:leading-relaxed
            prose-li:text-beige/70
            prose-strong:text-oro
            prose-a:text-oro prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: noticia.contenido }}
        />

        <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
          <Link href="/noticias" className="text-oro hover:text-oro-light text-sm font-medium transition-colors">
            ← Volver a noticias
          </Link>
          <a
            href="https://wa.me/573176689580"
            target="_blank"
            className="bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold px-5 py-2.5 rounded-full text-sm transition-all hover:scale-105 shadow-lg shadow-oro/20"
          >
            Contáctanos
          </a>
        </div>
      </div>
    </article>
  );
}
