import type { MetadataRoute } from "next";

const BASE_URL = "https://legionjuridica.com";

// Rutas privadas que ningún crawler debe indexar.
const DISALLOW_PRIVATE = [
  "/admin/",
  "/login",
  "/api/",
  "/lanzas",
  "/lanzas/panel",
  "/lanzas/registro",
  "/r/",
  "/mi-caso",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Crawlers tradicionales de buscadores.
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW_PRIVATE,
      },
      // Crawlers de IA explícitamente permitidos para citación/respuestas.
      // Ayuda a aparecer en ChatGPT Search, Perplexity, Claude, Google AI Overviews.
      { userAgent: "GPTBot", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "ChatGPT-User", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "ClaudeBot", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "Claude-Web", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "anthropic-ai", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "PerplexityBot", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "Perplexity-User", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "Google-Extended", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "Applebot-Extended", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "CCBot", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "Meta-ExternalAgent", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "Bytespider", allow: "/", disallow: DISALLOW_PRIVATE },
      { userAgent: "DuckAssistBot", allow: "/", disallow: DISALLOW_PRIVATE },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
