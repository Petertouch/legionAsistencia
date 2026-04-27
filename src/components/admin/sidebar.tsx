"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useAuth } from "@/components/providers/auth-provider";
import { useReferidorStore } from "@/lib/stores/referidor-store";
import {
  LayoutDashboard, Users, Scale, ClipboardList, PanelLeftClose, PanelLeftOpen,
  LogOut, X, BookOpen, Gift, UsersRound, FileText, GraduationCap, Mail, UserPen, Award,
  BadgeDollarSign, ClipboardCheck, Settings, QrCode,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "General",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "abogado", "profesor", "vendedor"] },
      { href: "/admin/mi-panel-vendedor", label: "Mi Panel", icon: BadgeDollarSign, roles: ["vendedor"] },
    ],
  },
  {
    label: "Clientes",
    items: [
      { href: "/admin/suscriptores", label: "Suscriptores", icon: Users, roles: ["admin"] },
      { href: "/admin/contratos", label: "Contratos", icon: FileText, roles: ["admin"] },
      { href: "/admin/validacion-identidad", label: "Identidad", icon: Users, roles: ["admin"] },
    ],
  },
  {
    label: "Legal",
    items: [
      { href: "/admin/casos", label: "Casos", icon: Scale, roles: ["admin", "abogado"] },
      { href: "/admin/seguimiento", label: "Seguimiento", icon: ClipboardList, roles: ["admin", "abogado"] },
    ],
  },
  {
    label: "Comercial",
    items: [
      { href: "/admin/referidores", label: "Aliados", icon: Gift, roles: ["admin"] },
      { href: "/admin/qrs", label: "Códigos QR", icon: QrCode, roles: ["admin"] },
      { href: "/admin/mails", label: "Emails", icon: Mail, roles: ["admin"] },
    ],
  },
  {
    label: "Educación",
    items: [
      { href: "/admin/cursos", label: "Mis Cursos", icon: GraduationCap, roles: ["profesor"] },
      { href: "/admin/cursos", label: "Cursos", icon: GraduationCap, roles: ["admin"] },
      { href: "/admin/profesores", label: "Profesores", icon: UserPen, roles: ["admin"] },
      { href: "/admin/diplomas", label: "Diplomas", icon: Award, roles: ["admin"] },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/admin/equipo", label: "Equipo", icon: UsersRound, roles: ["admin"] },
      { href: "/admin/configuracion", label: "Configuración", icon: Settings, roles: ["admin"] },
      { href: "/admin/conocimiento", label: "Conocimiento IA", icon: BookOpen, roles: ["admin"] },
      { href: "/admin/blueprint", label: "Blueprint QA", icon: ClipboardCheck, roles: ["admin"] },
    ],
  },
];

// Flat list for external use
export const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const { user, role, logout } = useAuth();
  const pendingLeads = useReferidorStore((s) => s.leads.filter((l) => l.status === "nuevo").length);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-panel-dark border-r border-white/10 flex flex-col z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-60"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 md:h-16 border-b border-white/10 flex-shrink-0">
          <a href="/" className="flex items-center gap-2.5">
            <Image src="/images/logo.svg" alt="Legión" width={28} height={28} className="flex-shrink-0" />
            {!collapsed && (
              <div className="flex items-center gap-1 overflow-hidden">
                <span className="text-white font-black text-sm tracking-[0.12em]">LEGIÓN</span>
                <span className="text-oro font-black text-sm tracking-[0.12em]">CRM</span>
              </div>
            )}
          </a>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-beige/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => !role || item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className="mb-1">
                {/* Section label */}
                {!collapsed && (
                  <p className="px-3 pt-3 pb-1 text-beige/25 text-[9px] font-semibold uppercase tracking-[0.15em]">
                    {section.label}
                  </p>
                )}
                {collapsed && <div className="h-2" />}

                {/* Items */}
                <div className="space-y-0.5">
                  {visibleItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname.startsWith(href);
                    const isLanzas = href === "/admin/referidores";

                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={handleNavClick}
                        title={collapsed ? label : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-oro/15 text-oro"
                            : "text-beige/50 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span className="relative flex-shrink-0">
                          <Icon className="w-[18px] h-[18px]" />
                          {isLanzas && pendingLeads > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                              {pendingLeads}
                            </span>
                          )}
                        </span>
                        {!collapsed && (
                          <span className="flex items-center gap-2">
                            {label}
                            {isLanzas && pendingLeads > 0 && (
                              <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {pendingLeads}
                              </span>
                            )}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 p-2 space-y-1">
          {user && !collapsed && (
            <div className="px-3 py-2 mb-1">
              <p className="text-white text-xs font-medium truncate">{user.nombre}</p>
              <p className="text-oro/60 text-[10px] capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={toggle}
            className="hidden md:flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-beige/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            {!collapsed && <span>Colapsar</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 md:py-2.5 rounded-lg text-sm text-beige/40 hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
