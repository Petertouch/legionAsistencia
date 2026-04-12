"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClientStore } from "@/lib/stores/client-store";
import { Shield, Heart, Users } from "lucide-react";
import { toast } from "sonner";

export default function ClientLoginPage() {
  const router = useRouter();
  const session = useClientStore((s) => s.session);
  const login = useClientStore((s) => s.login);
  const [mounted, setMounted] = useState(false);
  const [cedula, setCedula] = useState("");
  const [clave, setClave] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAliado, setShowAliado] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && session) router.replace("/mi-caso/perfil");
  }, [mounted, session, router]);

  if (!mounted || session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: cedula.trim(), clave }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      const session = await res.json();
      login(session);
      toast.success(`Bienvenido, ${session.nombre}`);
      router.push("/mi-caso/perfil");
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="w-14 h-14 bg-jungle-dark/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 text-jungle-dark" />
          </div>
          <h2 className="text-gray-900 font-bold text-lg">Portal del Cliente</h2>
          <p className="text-gray-500 text-sm mt-1">Ingresa para ver tus casos</p>
        </div>

        <div>
          <label className="text-gray-600 text-xs font-medium mb-1 block">Número de cédula</label>
          <input
            type="text"
            inputMode="numeric"
            value={cedula}
            onChange={(e) => { setCedula(e.target.value.replace(/\D/g, "")); setError(""); }}
            placeholder="Ej: 1098765432"
            required
            className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-gray-600 text-xs font-medium mb-1 block">Contraseña</label>
          <input
            type="password"
            value={clave}
            onChange={(e) => { setClave(e.target.value); setError(""); }}
            placeholder="••••••••"
            required
            className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !cedula.trim() || !clave}
          className="w-full bg-jungle-dark text-white font-semibold py-3 rounded-xl hover:bg-jungle transition-colors disabled:opacity-40 active:scale-[0.98]"
        >
          {loading ? "Verificando..." : "Ingresar"}
        </button>

        <Link
          href="/mi-caso/recuperar"
          className="block text-center text-jungle-dark/60 text-sm font-medium hover:text-jungle-dark underline underline-offset-2 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>

        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setShowAliado(true)}
            className="w-full text-center text-oro hover:text-oro-light text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Users className="w-4 h-4" /> Soy aliado
          </button>
        </div>
      </form>

      {/* ═══ Modal tipo de aliado ═══ */}
      {showAliado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAliado(false)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6 space-y-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-gray-900 font-bold text-lg">¿Qué tipo de aliado eres?</h3>
              <p className="text-gray-500 text-sm mt-1">Selecciona tu perfil para ingresar</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.push("/lanzas")}
                className="w-full flex items-center gap-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-4 transition-colors text-left group"
              >
                <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                  <Shield className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-sm">Lanza</p>
                  <p className="text-gray-500 text-xs">Militar o Policía activo/retirado</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push("/lanzas")}
                className="w-full flex items-center gap-4 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-xl p-4 transition-colors text-left group"
              >
                <div className="w-12 h-12 bg-pink-100 group-hover:bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                  <Heart className="w-6 h-6 text-pink-700" />
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-sm">Aliada</p>
                  <p className="text-gray-500 text-xs">Esposa o familiar de militar</p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAliado(false)}
              className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}