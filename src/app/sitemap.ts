import type { MetadataRoute } from "next";
import { BLOG_ARTICLES } from "@/lib/blog-data";
import { NOTICIAS } from "@/lib/noticias-data";

const BASE_URL = "https://legionjuridica.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/noticias`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = BLOG_ARTICLES.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const noticiasPages: MetadataRoute.Sitemap = NOTICIAS.map((noticia) => ({
    url: `${BASE_URL}/noticias/${noticia.slug}`,
    lastModified: new Date(noticia.fecha),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages, ...noticiasPages];
}
