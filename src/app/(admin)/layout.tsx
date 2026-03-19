"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/sidebar";
import Topbar from "@/components/admin/topbar";
import MobileBottomNav from "@/components/admin/mobile-bottom-nav";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { syncPersistedData } from "@/lib/stores/questions-store";

// Sync blog consultas/suscriptores from localStorage into mock arrays
syncPersistedData();

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useAuthStore.persist.rehydrate();
    useSidebarStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen bg-jungle-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-oro/30 border-t-oro rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jungle-dark">
      <Sidebar />
      <Topbar />
      <main className={`p-4 md:p-6 pt-3 md:pt-4 pb-20 md:pb-6 transition-all duration-300 ml-0 ${collapsed ? "md:ml-16" : "md:ml-60"}`}>
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}