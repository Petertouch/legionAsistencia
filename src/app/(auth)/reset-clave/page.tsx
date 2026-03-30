"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, CheckCircle, AlertTriangle } from "lucide-react";

export default function ResetClaveAdminPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-beige/30 text-sm">Cargando...</div>}>
      <ResetClaveAdminForm />
    </Suspense>
  );
}

function ResetClaveAdminForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h2 className="text-white font-bold text-lg">Enlace inválido</h2>
          <p className="text-beige/50 text-sm mt-2">Este enlace no es válido o ha expirado.</p>
          <Link href="/recuperar" className="inline-block mt-4 text-sm font-medium text-oro hover:underline">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 4) { setError("Mínimo 4 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || "Error"); return; }
    setDone(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 w-full max-w-sm mx-4 md:mx-0 space-y-4">
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <h2 className="text-white font-bold text-lg">Contraseña actualizada</h2>
            <p className="text-beige/50 text-sm mt-2">Ya puedes ingresar con tu nueva contraseña.</p>
            <Link href="/login" className="inline-block mt-6 bg-oro text-jungle-dark font-bold px-6 py-2.5 rounded-lg text-sm">
              Ir al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-white font-bold text-lg">Nueva contraseña</h2>
              <p className="text-beige/50 text-sm mt-1">Escribe tu nueva contraseña</p>
            </div>

            <div>
              <label className="text-beige/60 text-xs font-medium mb-1 block">Nueva contraseña</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Mínimo 4 caracteres" required
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
            </div>

            <div>
              <label className="text-beige/60 text-xs font-medium mb-1 block">Confirmar contraseña</label>
              <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                placeholder="Repite tu contraseña" required
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full bg-oro text-jungle-dark font-bold py-3 rounded-lg hover:bg-oro-light transition-colors disabled:opacity-40">
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
