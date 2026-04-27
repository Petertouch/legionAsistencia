"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Shield, Heart, Lock, PenTool } from "lucide-react";

export default function AliadoLoginPage() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [clave, setClave] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Change password flow
  const [showCambio, setShowCambio] = useState(false);
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const [pendingCode, setPendingCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/aliados/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: cedula.trim(), clave }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      if (data.debe_cambiar_clave) {
        setPendingCode(data.code);
        setShowCambio(true);
        setLoading(false);
        return;
      }

      router.push(`/aliados/panel?code=${data.code}`);
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  };

  const handleCambiarClave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (nuevaClave.length < 8) { setError("Mínimo 8 caracteres"); return; }
    if (nuevaClave !== confirmarClave) { setError("Las claves no coinciden"); return; }

    setCambiando(true);
    try {
      const res = await fetch("/api/aliados/cambiar-clave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: cedula.trim(), clave_actual: clave, clave_nueva: nuevaClave }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al cambiar clave");
        setCambiando(false);
        return;
      }

      toast.success("¡Clave actualizada!");
      router.push(`/aliados/panel?code=${pendingCode}`);
    } catch {
      setError("Error de conexión");
      setCambiando(false);
    }
  };

  // Change password screen
  if (showCambio) {
    return (
      <div className="min-h-screen bg-arena flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <PenTool className="w-7 h-7 text-oro" />
            </div>
            <h1 className="text-jungle-dark text-xl font-bold">Cambia tu clave</h1>
            <p className="text-gray-600 text-sm">Por seguridad, crea una clave personal antes de continuar.</p>
          </div>

          <form onSubmit={handleCambiarClave} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div>
              <label className="text-gray-600 text-xs font-medium mb-1 block">Nueva clave</label>
              <input type="password" value={nuevaClave} onChange={(e) => { setNuevaClave(e.target.value); setError(""); }} placeholder="Mínimo 8 caracteres" required minLength={8}
                className="w-full bg-arena text-jungle-dark placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro focus:outline-none" />
            </div>
            <div>
              <label className="text-gray-600 text-xs font-medium mb-1 block">Confirmar clave</label>
              <input type="password" value={confirmarClave} onChange={(e) => { setConfirmarClave(e.target.value); setError(""); }} placeholder="Repite tu nueva clave" required minLength={8}
                className="w-full bg-arena text-jungle-dark placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro focus:outline-none" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-xs">{error}</div>}
            <button type="submit" disabled={cambiando || nuevaClave.length < 8 || nuevaClave !== confirmarClave}
              className="w-full bg-gradient-to-r from-oro to-oro-light text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-oro/20">
              {cambiando ? "Guardando..." : "Guardar y entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arena flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-oro" />
          </div>
          <h1 className="text-jungle-dark text-2xl font-bold">Portal Aliados</h1>
          <p className="text-gray-600 text-sm">Ingresa con tu cédula y clave</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <label className="text-gray-600 text-xs font-bold mb-1 block uppercase tracking-wider">Cédula</label>
            <input type="text" value={cedula} onChange={(e) => { setCedula(e.target.value.replace(/\D/g, "")); setError(""); }}
              placeholder="Tu número de cédula" required inputMode="numeric"
              className="w-full bg-arena text-jungle-dark placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro focus:outline-none focus:ring-2 focus:ring-oro/20" />
          </div>
          <div>
            <label className="text-gray-600 text-xs font-bold mb-1 block uppercase tracking-wider">Clave</label>
            <input type="password" value={clave} onChange={(e) => { setClave(e.target.value); setError(""); }}
              placeholder="Tu clave" required
              className="w-full bg-arena text-jungle-dark placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro focus:outline-none focus:ring-2 focus:ring-oro/20" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-xs">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-oro to-oro-light text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-oro/20">
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <div className="space-y-3">
          <p className="text-gray-500 text-xs text-center">¿No tienes cuenta? Regístrate como:</p>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/aliados/registro"
              className="flex flex-col items-center gap-1.5 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl p-4 transition-colors">
              <Shield className="w-6 h-6 text-blue-700" />
              <span className="text-blue-700 text-xs font-bold">Lanza</span>
              <span className="text-gray-500 text-[10px] text-center">Militar / Policía</span>
            </Link>
            <Link href="/esposa"
              className="flex flex-col items-center gap-1.5 bg-white border border-pink-200 hover:border-pink-400 hover:bg-pink-50 rounded-2xl p-4 transition-colors">
              <Heart className="w-6 h-6 text-pink-700" />
              <span className="text-pink-700 text-xs font-bold">Aliada</span>
              <span className="text-gray-500 text-[10px] text-center">Esposa militar</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
