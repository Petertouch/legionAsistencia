"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useAuthStore, MOCK_USERS, type AuthUser } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { Shield, Scale } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AuthUser>(MOCK_USERS[0]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    login(selectedUser);
    toast.success(`Bienvenido, ${selectedUser.nombre}`);
    router.push("/admin/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 space-y-4 md:space-y-5 w-full max-w-sm mx-4 md:mx-0">
      <div className="text-center mb-2">
        <h2 className="text-white font-bold text-lg">Iniciar Sesión</h2>
        <p className="text-beige/50 text-sm mt-1">Panel administrativo</p>
      </div>

      {/* Role / User Selector */}
      <div>
        <label className="text-beige/60 text-xs font-medium mb-2 block">Ingresar como</label>
        <div className="space-y-2">
          {MOCK_USERS.map((u) => {
            const active = selectedUser.id === u.id;
            const Icon = u.role === "admin" ? Shield : Scale;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUser(u)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  active
                    ? "border-oro/50 bg-oro/10 text-white"
                    : "border-white/10 bg-white/5 text-beige/50 hover:border-white/20 hover:bg-white/8"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? "bg-oro/20" : "bg-white/10"}`}>
                  <Icon className={`w-4 h-4 ${active ? "text-oro" : "text-beige/40"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${active ? "text-white" : "text-beige/60"}`}>{u.nombre}</p>
                  <p className={`text-xs capitalize ${active ? "text-oro/70" : "text-beige/30"}`}>{u.role}</p>
                </div>
                {active && <div className="w-2 h-2 rounded-full bg-oro" />}
              </button>
            );
          })}
        </div>
      </div>

      <Input label="Email" name="email" type="email" value={selectedUser.email} readOnly className="opacity-60" />
      <Input label="Contraseña" name="password" type="password" placeholder="••••••••" required />

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Ingresando..." : `Ingresar como ${selectedUser.role === "admin" ? "Admin" : "Abogado"}`}
      </Button>

      <p className="text-center text-beige/30 text-xs">
        Acceso exclusivo para el equipo de Legión Jurídica
      </p>
    </form>
  );
}
