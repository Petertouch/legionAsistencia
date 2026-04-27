"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Mail, Check } from "lucide-react";
import { toast } from "sonner";

export default function RecuperarClavePage() {
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/aliados/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: cedula.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-arena flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-jungle-dark text-xl font-bold">¡Revisa tu correo!</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Si tu cédula está registrada, te enviamos una <strong>clave temporal</strong> al email que tenemos asociado.
            </p>
            <p className="text-gray-500 text-xs">
              Ingresa con tu cédula y esa clave. Te pediremos cambiarla.
            </p>
          </div>
          <Link href="/aliados"
            className="block w-full bg-gradient-to-r from-oro to-oro-light text-white font-bold py-3 rounded-xl text-sm text-center transition-all active:scale-[0.98] shadow-lg shadow-oro/20">
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arena flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7 text-oro" />
          </div>
          <h1 className="text-jungle-dark text-xl font-bold">Recuperar clave</h1>
          <p className="text-gray-600 text-sm">Ingresa tu cédula y te enviaremos una clave temporal a tu correo registrado.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <label className="text-gray-600 text-xs font-bold mb-1 block uppercase tracking-wider">Cédula</label>
            <input type="text" value={cedula} onChange={(e) => { setCedula(e.target.value.replace(/\D/g, "")); setError(""); }}
              placeholder="Tu número de cédula" required inputMode="numeric"
              className="w-full bg-arena text-jungle-dark placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro focus:outline-none focus:ring-2 focus:ring-oro/20" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-xs">{error}</div>}
          <button type="submit" disabled={loading || !cedula.trim()}
            className="w-full bg-gradient-to-r from-oro to-oro-light text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-oro/20">
            {loading ? "Enviando..." : "Enviar clave temporal"}
          </button>
        </form>

        <Link href="/aliados" className="flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al login
        </Link>
      </div>
    </div>
  );
}
