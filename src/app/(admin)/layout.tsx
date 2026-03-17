"use client";

import Sidebar from "@/components/admin/sidebar";
import Topbar from "@/components/admin/topbar";
import MobileBottomNav from "@/components/admin/mobile-bottom-nav";
import { useSidebarStore } from "@/lib/stores/sidebar-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarStore();

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
