import Image from "next/image";
import Link from "next/link";
import { getAllNoticias, CATEGORIA_COLORS } from "@/lib/noticias-data";

export const metadata = {
  title: "Noticias | Legión Jurídica",
  description: "Noticias, actualizaciones y artículos de Legión Jurídica — defensa legal especializada para la Fuerza Pública de Colombia.",
};

export default function NoticiasPage() {
  const noticias = getAllNoticias();

  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Noticias
        </h1>
        <p className="text-beige/50 mt-3 max-w-xl mx-auto">
          Actualizaciones, artículos y novedades de Legión Jurídica
        </p>
      </div>

      {noticias.length === 0 ? (
        <p className="text-center text-beige/40">No hay noticias publicadas aún.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {noticias.map((noticia) => {
            const cat = CATEGORIA_COLORS[noticia.categoria] ?? { bg: "bg-white/10", text: "text-white" };
            return (
              <Link
                key={noticia.id}
                href={`/noticias/${noticia.slug}`}
                className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-oro/30 transition-all duration-300"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={noticia.imagen}
                    alt={noticia.titulo}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
                      {noticia.categoria}
                    </span>
                    <span className="text-xs text-beige/40">
                      {new Date(noticia.fecha).toLocaleDateString("es-CO", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <h2 className="text-white font-bold text-lg leading-tight group-hover:text-oro transition-colors">
                    {noticia.titulo}
                  </h2>
                  <p className="text-beige/50 text-sm mt-2 line-clamp-3">
                    {noticia.extracto}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}