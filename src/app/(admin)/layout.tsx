"use client";

import Sidebar from "@/components/admin/sidebar";
import Topbar from "@/components/admin/topbar";
import { useSidebarStore } from "@/lib/stores/sidebar-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-jungle-dark">
      <Sidebar />
      <Topbar />
      <main
        className={`p-6 pt-4 transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-60"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
