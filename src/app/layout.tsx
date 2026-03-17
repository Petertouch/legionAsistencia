import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F2B0F",
};

export const metadata: Metadata = {
  title: "Legion Juridica | Asesoria Legal para Militares y Policias",
  description:
    "Asesoria juridica ilimitada para miembros de las Fuerzas Militares y Policia Nacional de Colombia. Planes desde $50.000/mes.",
  openGraph: {
    images: ["/images/index-meta.webp"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-arena text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
