"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X, ChevronRight } from "lucide-react";

const MAIN_LINKS = [
  ["/#como-funciona", "Cómo Funciona"],
  ["/#planes", "Planes"],
  ["/blog", "Blog"],
];

const SECONDARY_LINKS = [
  ["/#cobertura", "Cobertura"],
  ["/lanzas", "Programa Lanzas"],
  ["/mi-caso", "Ingresar"],
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled
        ? "bg-jungle-dark/95 backdrop-blur-md border-b border-oro/10 shadow-lg shadow-black/20"
        : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5">
            <Image src="/images/logo.svg" alt="Legión Jurídica" width={32} height={32}
              className="w-8 h-8 flex-shrink-0" />
            <div className="flex items-center gap-1">
              <span className="text-white font-black text-base sm:text-lg tracking-[0.15em]">LEGIÓN</span>
              <span className="text-oro font-black text-base sm:text-lg tracking-[0.15em]">JURÍDICA</span>
            </div>
          </a>

          {/* Desktop nav — centered */}
          <div className="hidden lg:flex items-center gap-8">
            {MAIN_LINKS.map(([href, label]) => (
              <a key={href} href={href}
                className="text-beige/60 hover:text-white text-sm font-medium transition-colors duration-200 relative group">
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-oro rounded-full group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <a href="/mi-caso"
              className="hidden lg:inline-flex text-beige/40 hover:text-white text-sm font-medium transition-colors">
              Ingresar
            </a>
            <a href="https://wa.me/573176689580" target="_blank"
              className="bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold px-5 py-2.5 rounded-full text-sm transition-all duration-300 active:scale-95 hover:scale-105 shadow-lg shadow-oro/20 hover:shadow-oro/30">
              Afíliate Ya
            </a>

            {/* Hamburger */}
            <button onClick={() => setOpen(!open)}
              className="lg:hidden text-beige/60 hover:text-white p-2 -mr-2 transition-colors">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${
        open ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
      }`}>
        <div className="bg-jungle-dark/98 backdrop-blur-lg border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {/* Main links */}
            {MAIN_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 text-white text-sm font-medium rounded-xl hover:bg-white/5 transition-colors">
                {label}
                <ChevronRight className="w-4 h-4 text-beige/20" />
              </a>
            ))}

            {/* Divider */}
            <div className="border-t border-white/5 my-2" />

            {/* Secondary links */}
            {SECONDARY_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-beige/50 text-sm rounded-xl hover:bg-white/5 hover:text-white transition-colors">
                {label}
                <ChevronRight className="w-4 h-4 text-beige/15" />
              </a>
            ))}

            {/* Contact */}
            <div className="border-t border-white/5 my-2" />
            <a href="tel:+573176689580"
              className="flex items-center gap-2.5 px-4 py-3 text-beige/40 text-sm rounded-xl hover:bg-white/5 transition-colors">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              317 668 9580
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
