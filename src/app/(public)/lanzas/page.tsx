"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Shield, ArrowRight } from "lucide-react";

export default function LanzaLoginPage() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: lanza } = await supabase
      .from("lanzas")
      .select("code, status")
      .eq("cedula", cedula.trim())
      .single();

    if (!lanza) {
      toast.error("No encontramos un Lanza con esa cédula");
      setLoading(false);
      return;
    }
    if (lanza.status === "inactivo") {
      toast.error("Tu cuenta de Lanza está inactiva. Contacta al admin.");
      setLoading(false);
      return;
    }
    router.push(`/lanzas/panel?code=${lanza.code}`);
  };

  return (
    <div className="min-h-screen bg-jungle-dark flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-oro/20 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-oro" />
          </div>
          <h1 className="text-white text-2xl font-bold">Portal Lanzas</h1>
          <p className="text-beige/50 text-sm">
            Ingresa con tu cédula para ver tu panel de referidos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-beige/60 text-xs font-medium mb-1 block">Cédula</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
              placeholder="Tu número de cédula"
              required
              inputMode="numeric"
              className="w-full bg-white/5 text-white placeholder-beige/30 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <div className="text-center space-y-3">
          <p className="text-beige/30 text-xs">¿No tienes cuenta de Lanza?</p>
          <Link
            href="/lanzas/registro"
            className="inline-flex items-center gap-1.5 text-oro text-sm font-medium hover:text-oro-light transition-colors"
          >
            Regístrate aquí <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
