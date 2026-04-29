import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legión Jurídica — Presentación Corporativa",
  description: "Asistencia jurídica integral y especializada para miembros de las Fuerzas Militares y Policía Nacional de Colombia. Conoce nuestros servicios y planes.",
  openGraph: {
    title: "Legión Jurídica — Presentación Corporativa",
    description: "Asistencia jurídica especializada para la Fuerza Pública. Derecho disciplinario, penal militar, familia y más. Conoce nuestra propuesta.",
    url: "https://legionjuridica.com/presentacion",
    siteName: "Legión Jurídica",
    images: [
      {
        url: "https://legionjuridica.com/images/og-presentacion.png",
        width: 1200,
        height: 630,
        alt: "Legión Jurídica — Presentación Corporativa",
      },
    ],
    type: "website",
  },
};

export default function PresentacionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}