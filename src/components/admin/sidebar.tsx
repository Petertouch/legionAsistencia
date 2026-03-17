"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useAuth } from "@/components/providers/auth-provider";
import {
  LayoutDashboard,
  Users,
  Scale,
  Inbox,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  X,
  BookOpen,
  Gift,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "abogado"] },
  { href: "/admin/suscriptores", label: "Suscriptores", icon: Users, roles: ["admin"] },
  { href: "/admin/casos", label: "Casos", icon: Scale, roles: ["admin", "abogado"] },
  { href: "/admin/leads", label: "Leads", icon: Inbox, roles: ["admin"] },
  { href: "/admin/seguimiento", label: "Seguimiento", icon: ClipboardList, roles: ["admin", "abogado"] },
  { href: "/admin/conocimiento", label: "Conocimiento IA", icon: BookOpen, roles: ["admin"] },
  { href: "/admin/recomendaciones", label: "Recomendaciones", icon: Gift, roles: ["admin"] },
];

export { NAV_ITEMS };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebarStore();
  const { user, role, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => !role || item.roles.includes(role));

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
          fixed left-0 top-0 h-screen bg-jungle-dark border-r border-white/10 flex flex-col z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-60"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 md:h-16 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Image src="/images/logo.svg" alt="Legion" width={28} height={28} className="flex-shrink-0" />
            {!collapsed && (
              <div className="flex items-center gap-1 overflow-hidden">
                <span className="text-white font-black text-sm tracking-[0.12em]">LEGION</span>
                <span className="text-oro font-black text-sm tracking-[0.12em]">CRM</span>
              </div>
            )}
          </div>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-beige/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={handleNavClick}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-oro/15 text-oro"
                    : "text-beige/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
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
          {/* Collapse toggle — desktop only */}
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
