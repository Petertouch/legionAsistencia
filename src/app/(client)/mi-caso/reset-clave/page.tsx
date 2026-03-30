"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, CheckCircle, AlertTriangle } from "lucide-react";

export default function ResetClavePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">Cargando...</div>}>
      <ResetClaveForm />
    </Suspense>
  );
}

function ResetClaveForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-full max-w-sm text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-gray-900 font-bold text-lg">Enlace inválido</h2>
          <p className="text-gray-500 text-sm mt-2">Este enlace no es válido o ha expirado.</p>
          <Link href="/mi-caso/recuperar" className="inline-block mt-4 text-sm font-medium text-jungle-dark hover:underline">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Error al actualizar contraseña");
      return;
    }

    setDone(true);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-full max-w-sm space-y-4">
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-gray-900 font-bold text-lg">Contraseña actualizada</h2>
            <p className="text-gray-500 text-sm mt-2">Ya puedes ingresar con tu nueva contraseña.</p>
            <Link
              href="/mi-caso"
              className="inline-block mt-6 bg-jungle-dark text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-jungle transition-colors text-sm"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-jungle-dark/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-7 h-7 text-jungle-dark" />
              </div>
              <h2 className="text-gray-900 font-bold text-lg">Nueva contraseña</h2>
              <p className="text-gray-500 text-sm mt-1">Escribe tu nueva contraseña</p>
            </div>

            <div>
              <label className="text-gray-600 text-xs font-medium mb-1 block">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Mínimo 4 caracteres"
                required
                className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-gray-600 text-xs font-medium mb-1 block">Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                placeholder="Repite tu contraseña"
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
              disabled={loading}
              className="w-full bg-jungle-dark text-white font-semibold py-3 rounded-xl hover:bg-jungle transition-colors disabled:opacity-40"
            >
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
