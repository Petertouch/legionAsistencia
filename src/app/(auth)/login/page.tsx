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

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      // Guardar en Zustand para UI client-side (navbar, etc)
      login(data.user);
      toast.success(`Bienvenido, ${data.user.nombre}`);
      router.push("/admin/dashboard");
    } catch {
      toast.error("Error de conexión");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 space-y-4 md:space-y-5 w-full max-w-sm mx-4 md:mx-0">
      <div className="text-center mb-2">
        <h2 className="text-white font-bold text-lg">Iniciar Sesión</h2>
        <p className="text-beige/50 text-sm mt-1">Panel administrativo</p>
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
