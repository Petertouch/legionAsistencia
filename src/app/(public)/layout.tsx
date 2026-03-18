import Image from "next/image";
import ChatBot from "@/components/chatbot";

function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-jungle-dark/90 backdrop-blur-md border-b border-oro/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          <a href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Image
              src="/images/logo.svg"
              alt="Legión Jurídica"
              width={36}
              height={36}
              className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
            />
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-white font-black text-sm sm:text-lg lg:text-xl tracking-[0.15em] sm:tracking-[0.2em]">
                LEGION
              </span>
              <span className="text-oro font-black text-sm sm:text-lg lg:text-xl tracking-[0.15em] sm:tracking-[0.2em]">
                JURÍDICA
              </span>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {[
              ["#como-funciona", "Cómo Funciona"],
              ["#cobertura", "Cobertura"],
              ["#planes", "Planes"],
              ["/blog", "Guía Legal"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-beige/70 hover:text-oro text-sm font-medium transition-colors duration-300"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/admin/dashboard"
              className="text-beige/30 hover:text-oro transition-colors p-1.5"
              title="Panel Admin"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </a>
            <a
              href="tel:+573176689580"
              className="hidden sm:flex items-center gap-1.5 text-beige/60 hover:text-white text-xs sm:text-sm transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="hidden md:inline">317 668 9580</span>
            </a>
            <a
              href="https://wa.me/573176689580"
              target="_blank"
              className="bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-lg shadow-oro/20"
            >
              Afíliate Ya
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/573176689580"
      target="_blank"
      className="fixed bottom-5 right-5 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] hover:bg-[#20BD5A] rounded-full flex items-center justify-center shadow-xl shadow-black/20 transition-transform active:scale-90 sm:hover:scale-110 safe-bottom"
      aria-label="Contactar por WhatsApp"
    >
      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

function Footer() {
  return (
    <footer className="bg-jungle-dark text-beige/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/images/logo.svg"
                alt="Legión Jurídica"
                width={32}
                height={32}
                className="w-7 h-7 sm:w-8 sm:h-8"
              />
              <span className="text-white font-black tracking-[0.12em] text-base sm:text-lg">
                LEGION
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed max-w-xs">
              Asesoría jurídica ilimitada para quienes protegen a Colombia.
              Defensa real. Tranquilidad garantizada.
            </p>
          </div>
          <div>
            <h4 className="text-oro font-bold mb-3 sm:mb-4 text-xs sm:text-sm tracking-wider uppercase">Navegación</h4>
            <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              {["Cómo Funciona", "Cobertura", "Planes", "Testimonios"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="block hover:text-oro transition-colors py-0.5">{item}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-oro font-bold mb-3 sm:mb-4 text-xs sm:text-sm tracking-wider uppercase">Contacto</h4>
            <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <a href="tel:+573176689580" className="block hover:text-oro transition-colors">+(57) 317 668 9580</a>
              <a href="tel:+573160541006" className="block hover:text-oro transition-colors">+(57) 316 054 1006</a>
              <a href="mailto:info@legionjuridica.com" className="block hover:text-oro transition-colors break-all">info@legionjuridica.com</a>
              <p>Cra 7 # 81-49 Of. 301, Bogotá</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <p>&copy; 2026 Legión Jurídica. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-[11px] sm:text-xs">Asistente legal activo 24/7</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <ChatBot />
      <WhatsAppFloat />
    </>
  );
}
