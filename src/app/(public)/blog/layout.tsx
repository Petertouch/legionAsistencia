import type { Metadata } from "next";

const TITLE = "Consulta legal GRATIS para militares y policías";
const DESC =
  "Escribe tu pregunta y un abogado experto en derecho militar y policial te orienta gratis, directo a tu correo. Disciplinarios, pensión, ascensos, familia y más — confidencial y sin costo.";

export const metadata: Metadata = {
  title: "Consulta legal gratis para militares y policías",
  description: DESC,
  alternates: { canonical: "https://legionjuridica.com/blog" },
  openGraph: {
    title: TITLE,
    description:
      "Un abogado experto en derecho militar y policial te orienta gratis, a tu correo. Disciplinarios · Pensión · Ascensos · Familia. Confidencial y sin costo.",
    url: "https://legionjuridica.com/blog",
    siteName: "Legión Jurídica",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "Un abogado experto te orienta gratis, a tu correo. Confidencial y sin costo.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
