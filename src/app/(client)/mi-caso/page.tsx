"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClientStore } from "@/lib/stores/client-store";
import { MOCK_SUSCRIPTORES } from "@/lib/mock-data";
import { Shield, UserCircle } from "lucide-react";
import { toast } from "sonner";

const MOCK_PASSWORDS: Record<string, string> = { "123": "123" };
const DEFAULT_PASSWORD = "legion2026";

export default function ClientLoginPage() {
  const router = useRouter();
  const { session, login } = useClientStore();
  const [mounted, setMounted] = useState(false);
  const [cedula, setCedula] = useState("");
  const [clave, setClave] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && session) router.replace("/mi-caso/perfil");
  }, [mounted, session, router]);

  if (!mounted || session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 500));

    const suscriptor = MOCK_SUSCRIPTORES.find((s) => s.cedula === cedula.trim());
    if (!suscriptor) {
      setError("Cédula no encontrada. Verifica el número.");
      setLoading(false);
      return;
    }

    const expected = MOCK_PASSWORDS[suscriptor.cedula] || DEFAULT_PASSWORD;
    if (clave !== expected) {
      setError("Contraseña incorrecta.");
      setLoading(false);
      return;
    }

    login({
      suscriptor_id: suscriptor.id,
      nombre: suscriptor.nombre,
      cedula: suscriptor.cedula,
      email: suscriptor.email,
      telefono: suscriptor.telefono,
      plan: suscriptor.plan,
      estado_pago: suscriptor.estado_pago,
      rama: suscriptor.rama,
      rango: suscriptor.rango,
    });

    toast.success(`Bienvenido, ${suscriptor.nombre}`);
    router.push("/mi-caso/perfil");
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

        <p className="text-center text-gray-400 text-xs">
          Si no tienes acceso, contacta a tu abogado
        </p>
      </form>
    </div>
  );
}
