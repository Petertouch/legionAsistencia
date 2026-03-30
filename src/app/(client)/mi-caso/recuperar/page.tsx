"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, CheckCircle } from "lucide-react";

export default function RecuperarClavePage() {
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: cedula.trim(), type: "cliente" }),
    });

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-full max-w-sm space-y-4">
        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-gray-900 font-bold text-lg">Revisa tu email</h2>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Si tu cédula está registrada, recibirás un email con un enlace para restablecer tu contraseña.
            </p>
            <Link
              href="/mi-caso"
              className="inline-block mt-6 text-sm font-medium text-jungle-dark hover:underline"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-jungle-dark/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-7 h-7 text-jungle-dark" />
              </div>
              <h2 className="text-gray-900 font-bold text-lg">Recuperar contraseña</h2>
              <p className="text-gray-500 text-sm mt-1">Ingresa tu cédula y te enviaremos un email</p>
            </div>

            <div>
              <label className="text-gray-600 text-xs font-medium mb-1 block">Número de cédula</label>
              <input
                type="text"
                inputMode="numeric"
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                placeholder="Ej: 1098765432"
                required
                className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !cedula.trim()}
              className="w-full bg-jungle-dark text-white font-semibold py-3 rounded-xl hover:bg-jungle transition-colors disabled:opacity-40"
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>

            <Link
              href="/mi-caso"
              className="flex items-center justify-center gap-1 text-gray-400 text-xs hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Volver al inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
