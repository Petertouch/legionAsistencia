"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClientStore } from "@/lib/stores/client-store";
import { User, Scale, Gift, LogOut, MessageCircle, FileText, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useClientStore((s) => s.session);
  const logout = useClientStore((s) => s.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    useClientStore.persist.rehydrate();
    setMounted(true);
  }, []);

  const isLoginPage = pathname === "/mi-caso";
  const isPublicCasePage = pathname.startsWith("/mi-caso/") && !pathname.startsWith("/mi-caso/perfil") && !pathname.startsWith("/mi-caso/casos") && !pathname.startsWith("/mi-caso/referidos") && !pathname.startsWith("/mi-caso/contrato") && !pathname.startsWith("/mi-caso/cursos");
  const showNav = mounted && session && !isLoginPage;

  const handleLogout = () => {
    logout();
    router.push("/mi-caso");
  };

  return (
    <div className="min-h-screen bg-arena flex flex-col">
      {/* Header */}
      <header className="bg-jungle-dark border-b border-white/10 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href={session ? "/mi-caso/perfil" : "/"} className="flex items-center gap-2.5">
            <Image src="/images/logo.svg" alt="Legion Juridica" width={28} height={28} />
            <div className="flex items-center gap-1">
              <span className="text-white font-black text-sm tracking-[0.12em]">LEGIÓN</span>
              <span className="text-oro font-black text-sm tracking-[0.12em]">JURÍDICA</span>
            </div>
          </Link>
          {showNav && (
            <div className="flex items-center gap-2">
              <span className="text-beige/50 text-xs hidden sm:block">{session.nombre}</span>
              <button onClick={handleLogout} className="text-beige/40 hover:text-red-400 p-1.5 transition-colors" title="Cerrar sesión">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Nav tabs */}
      {showNav && !isPublicCasePage && (
        <nav className="bg-jungle-dark border-b border-white/10 px-4 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex gap-1">
            {[
              { href: "/mi-caso/perfil", label: "Mi Perfil", icon: User },
              { href: "/mi-caso/contrato", label: "Mi Contrato", icon: FileText },
              { href: "/mi-caso/casos", label: "Mis Casos", icon: Scale },
              { href: "/mi-caso/cursos", label: "Cursos", icon: GraduationCap },
              { href: "/mi-caso/referidos", label: "Referidos", icon: Gift },
            ].map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href === "/mi-caso/casos" && pathname.startsWith("/mi-caso/casos/"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    active
                      ? "border-oro text-oro"
                      : "border-transparent text-beige/40 hover:text-beige/70"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 w-full flex-1">
        {children}
      </main>

      {/* WhatsApp FAB */}
      <a
        href="https://wa.me/573176689580"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 transition-colors active:scale-90 z-40"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </a>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-400 text-xs flex-shrink-0">
        <p>Legión Jurídica &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
