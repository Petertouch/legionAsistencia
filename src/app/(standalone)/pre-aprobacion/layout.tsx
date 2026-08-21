import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pre-aprobación · Legión Jurídica",
  description: "Revisión y pre-aprobación de afiliados (equipo comercial).",
  robots: { index: false, follow: false },
};

export default function PreAprobacionLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-100">{children}</div>;
}
