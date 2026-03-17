"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LayoutDashboard, Scale, ClipboardList, Users, Inbox } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Inicio", icon: LayoutDashboard, roles: ["admin", "abogado"] },
  { href: "/admin/casos", label: "Casos", icon: Scale, roles: ["admin", "abogado"] },
  { href: "/admin/suscriptores", label: "Clientes", icon: Users, roles: ["admin"] },
  { href: "/admin/leads", label: "Leads", icon: Inbox, roles: ["admin"] },
  { href: "/admin/seguimiento", label: "Actividad", icon: ClipboardList, roles: ["admin", "abogado"] },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => !role || item.roles.includes(role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-jungle-dark/95 backdrop-blur-md border-t border-white/10 safe-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[56px] transition-colors ${
                active ? "text-oro" : "text-beige/40"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
