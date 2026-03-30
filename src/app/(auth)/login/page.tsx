"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTeamStore } from "@/lib/stores/team-store";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const teamMembers = useTeamStore((s) => s.abogados);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const emailNorm = email.toLowerCase().trim();

    // ── 1. Intentar login de admin/abogado via API (server-side) ──
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
        router.push(data.user.role === "profesor" ? "/admin/dashboard" : "/admin/dashboard");
        return;
      }
    } catch {
      // Si falla la API, intentar con profesores locales
    }

    // ── 2. Verificar profesores del team store (client-side) ──
    const profesor = teamMembers.find(
      (m) => m.role === "profesor" && m.email.toLowerCase() === emailNorm && m.password === password
    );

    if (profesor) {
      // Crear sesión via API
      try {
        const res = await fetch("/api/auth/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: profesor.id,
            nombre: profesor.nombre,
            email: profesor.email,
            role: "profesor",
          }),
        });

        if (res.ok) {
          login({
            id: profesor.id,
            nombre: profesor.nombre,
            email: profesor.email,
            role: "profesor" as any,
          });
          toast.success(`Bienvenido, ${profesor.nombre}`);
          router.push("/admin/dashboard");
          setLoading(false);
          return;
        }
      } catch {
        // fall through
      }
    }

    toast.error("Email o contraseña incorrectos");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 space-y-4 md:space-y-5 w-full max-w-sm mx-4 md:mx-0">
      <div className="text-center mb-2">
        <h2 className="text-white font-bold text-lg">Iniciar Sesión</h2>
        <p className="text-beige/50 text-sm mt-1">Equipo Legión Jurídica</p>
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
        className="block text-center text-beige/30 text-xs hover:text-oro transition-colors"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </form>
  );
}
