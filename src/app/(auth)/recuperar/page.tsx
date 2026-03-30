"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, CheckCircle } from "lucide-react";

export default function RecuperarAdminPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email.trim(), type: "admin" }),
    });

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      {sent ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
          <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-white font-bold text-lg">Revisa tu email</h2>
          <p className="text-beige/50 text-sm leading-relaxed">
            Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
          </p>
          <Link href="/login" className="inline-block text-sm font-medium text-oro hover:underline">
            ← Volver al login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 space-y-4 w-full max-w-sm mx-4 md:mx-0">
          <div className="text-center mb-2">
            <h2 className="text-white font-bold text-lg">Recuperar contraseña</h2>
            <p className="text-beige/50 text-sm mt-1">Ingresa tu email del panel</p>
          </div>

          <div>
            <label className="text-beige/60 text-xs font-medium mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-oro text-jungle-dark font-bold py-3 rounded-lg hover:bg-oro-light transition-colors disabled:opacity-40"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>

          <Link href="/login" className="flex items-center justify-center gap-1 text-beige/30 text-xs hover:text-white transition-colors">
            <ArrowLeft className="w-3 h-3" /> Volver al login
          </Link>
        </form>
      )}
    </div>
  );
}
