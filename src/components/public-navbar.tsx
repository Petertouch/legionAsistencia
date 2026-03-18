"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  ["/#como-funciona", "Cómo Funciona"],
  ["/#cobertura", "Cobertura"],
  ["/#planes", "Planes"],
  ["/blog", "Guía Legal"],
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-jungle-dark/90 backdrop-blur-md border-b border-oro/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Image src="/images/logo.svg" alt="Legión Jurídica" width={36} height={36}
              className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-white font-black text-sm sm:text-lg lg:text-xl tracking-[0.15em] sm:tracking-[0.2em]">LEGION</span>
              <span className="text-oro font-black text-sm sm:text-lg lg:text-xl tracking-[0.15em] sm:tracking-[0.2em]">JURÍDICA</span>
            </div>
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href}
                className="text-beige/70 hover:text-oro text-sm font-medium transition-colors duration-300">
                {label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="/admin/dashboard" className="text-beige/30 hover:text-oro transition-colors p-1.5" title="Panel Admin">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </a>
            <a href="tel:+573176689580"
              className="hidden sm:flex items-center gap-1.5 text-beige/60 hover:text-white text-xs sm:text-sm transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="hidden md:inline">317 668 9580</span>
            </a>
            <a href="https://wa.me/573176689580" target="_blank"
              className="bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-lg shadow-oro/20">
              Afíliate Ya
            </a>

            {/* Hamburger - mobile only */}
            <button onClick={() => setOpen(!open)} className="lg:hidden text-beige/60 hover:text-white p-1.5 -mr-1.5 transition-colors">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-jungle-dark/95 backdrop-blur-md border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}
                className="block px-3 py-3 text-beige/70 hover:text-oro text-sm font-medium rounded-lg hover:bg-white/5 transition-all">
                {label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/5 mt-2">
              <a href="tel:+573176689580" className="flex items-center gap-2 px-3 py-3 text-beige/50 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                317 668 9580
              </a>
              <a href="/mi-caso" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-3 text-beige/50 text-sm hover:text-oro transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Portal de clientes
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
