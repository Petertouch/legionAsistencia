"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // ── Login del staff via API (valida contra Supabase Auth o tabla equipo según AUTH_PROVIDER) ──
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.user);
        toast.success(`Bienvenido, ${data.user.nombre}`);
        router.push("/admin/dashboard");
        return;
      }
    } catch {
      // Error de red
    }

    toast.error("Email o contraseña incorrectos");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 md:p-8 space-y-4 md:space-y-5 w-full max-w-sm mx-4 md:mx-0">
      <div className="text-center mb-2">
        <h2 className="text-gray-900 font-bold text-lg">Iniciar Sesión</h2>
        <p className="text-gray-500 text-sm mt-1">Equipo Legión Jurídica</p>
      </div>

      <Input
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="correo@ejemplo.com"
        required
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Ingresando..." : "Ingresar"}
      </Button>

      <Link
        href="/recuperar"
        className="block text-center text-gray-400 text-xs hover:text-oro transition-colors"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </form>
  );
}
