"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Shield, ArrowRight, Heart } from "lucide-react";

export default function AliadoLoginPage() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: lanza } = await supabase
      .from("lanzas")
      .select("code, status, tipo")
      .eq("cedula", cedula.trim())
      .single();

    if (!lanza) {
      toast.error("No encontramos un aliado con esa cédula");
      setLoading(false);
      return;
    }
    if (lanza.status === "inactivo") {
      toast.error("Tu cuenta está inactiva. Contacta al admin.");
      setLoading(false);
      return;
    }
    router.push(`/aliados/panel?code=${lanza.code}`);
  };

  return (
    <div className="min-h-screen bg-arena flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-oro" />
          </div>
          <h1 className="text-jungle-dark text-2xl font-bold">Portal Aliados</h1>
          <p className="text-gray-600 text-sm">
            Ingresa con tu cédula para ver tu panel de referidos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <label className="text-gray-600 text-xs font-bold mb-1 block uppercase tracking-wider">Cédula</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
              placeholder="Tu número de cédula"
              required
              inputMode="numeric"
              className="w-full bg-arena text-jungle-dark placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro focus:outline-none focus:ring-2 focus:ring-oro/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-oro to-oro-light text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-oro/20"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <div className="space-y-3">
          <p className="text-gray-500 text-xs text-center">¿No tienes cuenta? Regístrate como:</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/aliados/registro"
              className="flex flex-col items-center gap-1.5 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl p-4 transition-colors group"
            >
              <Shield className="w-6 h-6 text-blue-700" />
              <span className="text-blue-700 text-xs font-bold">Lanza</span>
              <span className="text-gray-500 text-[10px] text-center">Militar / Policía</span>
            </Link>
            <Link
              href="/esposa"
              className="flex flex-col items-center gap-1.5 bg-white border border-pink-200 hover:border-pink-400 hover:bg-pink-50 rounded-2xl p-4 transition-colors group"
            >
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
