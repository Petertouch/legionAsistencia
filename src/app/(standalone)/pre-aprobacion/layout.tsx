import type { Metadata } from "next";

const TITLE = "Pre-aprobación de afiliados · Legión Jurídica";
const DESCRIPTION =
  "Portal del equipo comercial para revisar, corregir y pre-aprobar los datos de los afiliados. Ingreso con correo y clave.";
const URL = "https://legionjuridica.com/pre-aprobacion";
const IMAGE = "https://legionjuridica.com/images/index-meta.webp";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: URL,
    siteName: "Legión Jurídica",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: IMAGE, width: 1200, height: 630, alt: "Legión Jurídica — Pre-aprobación de afiliados" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE],
  },
};

export default function PreAprobacionLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-100">{children}</div>;
}
