import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/providers";

const BASE_URL = "https://legionjuridica.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F2B0F",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Legión Jurídica | Asesoría Legal para Militares y Policías de Colombia",
    template: "%s | Legión Jurídica",
  },
  description:
    "Asesoría jurídica ilimitada para miembros de las Fuerzas Militares y Policía Nacional de Colombia. Disciplinarios, penal militar, familia y más. Planes desde $50.000/mes.",
  keywords: [
    "abogado militar Colombia",
    "abogado policía Colombia",
    "derecho penal militar",
    "proceso disciplinario militar",
    "proceso disciplinario policia",
    "asesoría jurídica militar",
    "abogado fuerzas militares",
    "abogado ejército Colombia",
    "defensa disciplinaria militar",
    "tutela militar",
    "derecho de petición militar",
    "legión jurídica",
    "abogado para soldados",
    "abogado patrulleros",
    "suscripción legal militar",
  ],
  authors: [{ name: "Legión Jurídica" }],
  creator: "Legión Jurídica",
  publisher: "Legión Jurídica",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: BASE_URL,
    siteName: "Legión Jurídica",
    title: "Legión Jurídica | Asesoría Legal para Militares y Policías",
    description:
      "Tu misión es servir a la patria. La nuestra es protegerte. Asesoría jurídica ilimitada desde $50.000/mes.",
    images: [
      {
        url: "/images/index-meta.webp",
        width: 1200,
        height: 630,
        alt: "Legión Jurídica — Asesoría legal para militares y policías de Colombia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Legión Jurídica | Asesoría Legal para Militares y Policías",
    description:
      "Asesoría jurídica ilimitada para Fuerzas Militares y Policía Nacional. Planes desde $50.000/mes.",
    images: ["/images/index-meta.webp"],
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: "Legal Services",
  verification: {
    // Reemplaza estos valores con los códigos reales de cada plataforma.
    // Google Search Console → Ajustes → Verificación de propiedad → Etiqueta HTML
    google: "REPLACE_WITH_GOOGLE_SEARCH_CONSOLE_TOKEN",
    // Bing Webmaster Tools → My Sites → Verify → Meta tag
    other: {
      "msvalidate.01": "REPLACE_WITH_BING_WEBMASTER_TOKEN",
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: "Legión Jurídica",
  description:
    "Firma de abogados especializada en asesoría jurídica para miembros activos y retirados de las Fuerzas Militares y Policía Nacional de Colombia.",
  url: BASE_URL,
  logo: `${BASE_URL}/images/logo.svg`,
  image: `${BASE_URL}/images/index-meta.webp`,
  telephone: ["+573176689580", "+573160541006"],
  email: "info@legionjuridica.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Cra 7 # 81-49 Of. 301",
    addressLocality: "Bogotá",
    addressCountry: "CO",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 4.6651,
    longitude: -74.0535,
  },
  areaServed: {
    "@type": "Country",
    name: "Colombia",
  },
  priceRange: "$50.000 - $150.000 COP/mes",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
  sameAs: ["https://wa.me/573176689580"],
  serviceType: [
    "Derecho Penal Militar",
    "Procesos Disciplinarios",
    "Derecho de Familia",
    "Derecho Civil",
    "Protección al Consumidor",
    "Documentos Legales",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Planes de Suscripción Legal",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Plan Base",
        price: "50000",
        priceCurrency: "COP",
        description: "2 representaciones/año, 4 opiniones/mes, revisión de documentos, atención por WhatsApp",
      },
      {
        "@type": "Offer",
        name: "Plan Plus",
        price: "90000",
        priceCurrency: "COP",
        description: "3 representaciones/año, 8 opiniones/mes, prioridad en asignación, WhatsApp y llamada",
      },
      {
        "@type": "Offer",
        name: "Plan Elite",
        price: "150000",
        priceCurrency: "COP",
        description: "5 representaciones/año, opiniones ilimitadas, abogado dedicado, atención prioritaria 24/7",
      },
    ],
  },
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "Legión Jurídica",
  alternateName: "Legión Jurídica Colombia",
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/images/logo.svg`,
    width: 512,
    height: 512,
  },
  image: `${BASE_URL}/images/index-meta.webp`,
  description:
    "Firma de abogados colombiana especializada en asesoría jurídica integral para miembros activos y retirados de las Fuerzas Militares y Policía Nacional de Colombia.",
  foundingDate: "2020",
  areaServed: {
    "@type": "Country",
    name: "Colombia",
  },
  knowsAbout: [
    "Derecho Penal Militar",
    "Procesos Disciplinarios Militares",
    "Procesos Disciplinarios Policiales",
    "Derecho de Familia",
    "Derecho Civil",
    "Tutelas",
    "Derechos de Petición",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+573176689580",
      contactType: "customer service",
      areaServed: "CO",
      availableLanguage: ["Spanish"],
    },
    {
      "@type": "ContactPoint",
      telephone: "+573160541006",
      contactType: "customer service",
      areaServed: "CO",
      availableLanguage: ["Spanish"],
    },
  ],
  sameAs: ["https://wa.me/573176689580"],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  url: BASE_URL,
  name: "Legión Jurídica",
  description:
    "Asesoría jurídica ilimitada para Fuerzas Militares y Policía Nacional de Colombia.",
  publisher: { "@id": `${BASE_URL}/#organization` },
  inLanguage: "es-CO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body className="bg-arena text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
