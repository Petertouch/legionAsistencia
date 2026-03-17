"use client";

import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useAuth } from "@/components/providers/auth-provider";
import { Shield, Scale } from "lucide-react";

const TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/suscriptores": "Suscriptores",
  "/admin/casos": "Casos Legales",
  "/admin/leads": "Leads",
  "/admin/seguimiento": "Seguimiento",
};

export default function Topbar() {
  const pathname = usePathname();
  const { collapsed } = useSidebarStore();
  const { user } = useAuth();

  const title = Object.entries(TITLES).find(([path]) => pathname.startsWith(path))?.[1] || "Admin";
  const RoleIcon = user?.role === "admin" ? Shield : Scale;

  return (
    <header
      className={`sticky top-0 z-30 h-16 bg-jungle-dark/80 backdrop-blur-md border-b border-white/10 flex items-center px-6 transition-all duration-300 ${
        collapsed ? "ml-16" : "ml-60"
      }`}
    >
      <h1 className="text-white font-bold text-lg">{title}</h1>
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-beige/50 text-xs hidden sm:inline">Sistema activo</span>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-oro/20 rounded-full flex items-center justify-center">
              <RoleIcon className="w-4 h-4 text-oro" />
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-xs font-medium leading-tight">{user.nombre}</p>
              <p className="text-oro/50 text-[10px] capitalize leading-tight">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
