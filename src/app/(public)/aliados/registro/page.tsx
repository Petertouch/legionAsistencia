"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getComisionLanza } from "@/lib/config";
import { toast } from "sonner";
import { UserPlus, Check } from "lucide-react";

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

const RAMAS = ["Ejército", "Policía", "Armada", "Fuerza Aérea", "Civil", "Otro"];

export default function LanzaRegistroPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [code, setCode] = useState("");
  const [comision, setComision] = useState(50000);

  useEffect(() => { getComisionLanza().then(setComision); }, []);
  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    email: "",
    ciudad: "",
    rama: "Ejército",
    rango: "",
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/aliados/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tipo: "lanza" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al registrar");
        setSubmitting(false);
        return;
      }

      setCode(data.code);
      setSuccess(true);
      setSubmitting(false);
      toast.success("¡Registro exitoso!");
    } catch {
      toast.error("Error de conexión");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-4 shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-gray-900 text-xl font-bold">¡Bienvenido a los Lanzas!</h2>
          <p className="text-gray-600 text-sm">
            Tu código único es: <span className="text-oro font-bold text-lg">{code}</span>
          </p>
          <p className="text-gray-500 text-xs">
            Comparte tu link personalizado con tus contactos y gana {formatMoney(comision)} por cada cliente que se afilie.
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => router.push(`/aliados/panel?code=${code}`)}
              className="w-full bg-gradient-to-r from-oro to-oro-light text-white font-bold py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] shadow-md"
            >
              Ir a mi panel
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
                toast.success("Link copiado");
              }}
              className="w-full bg-gray-100 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors"
            >
              Copiar mi link de referidos
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputCls = "w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-300 focus:border-oro/50 focus:ring-2 focus:ring-oro/10 focus:outline-none transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-oro/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <UserPlus className="w-7 h-7 text-oro" />
        </div>
        <h1 className="text-gray-900 text-2xl font-bold">Sé un Lanza</h1>
        <p className="text-gray-500 text-sm mt-1">
          Regístrate y gana <span className="text-oro font-bold">{formatMoney(comision)}</span> por cada persona que afiliemos gracias a ti
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
        <div>
          <label className="text-gray-600 text-xs font-medium mb-1 block">Nombre completo *</label>
          <input type="text" required value={form.nombre} onChange={(e) => update("nombre", e.target.value)} placeholder="Tu nombre y apellido" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-600 text-xs font-medium mb-1 block">Cédula *</label>
            <input type="text" required value={form.cedula} onChange={(e) => update("cedula", e.target.value.replace(/\D/g, ""))} placeholder="12345678" inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className="text-gray-600 text-xs font-medium mb-1 block">Teléfono *</label>
            <input type="tel" required value={form.telefono} onChange={(e) => update("telefono", e.target.value.replace(/\D/g, ""))} placeholder="3176689580" inputMode="numeric" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="text-gray-600 text-xs font-medium mb-1 block">Email</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="correo@ejemplo.com" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-600 text-xs font-medium mb-1 block">Ciudad</label>
            <input type="text" value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)} placeholder="Bogotá" className={inputCls} />
          </div>
          <div>
            <label className="text-gray-600 text-xs font-medium mb-1 block">Rama</label>
            <select value={form.rama} onChange={(e) => update("rama", e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
              {RAMAS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-gray-600 text-xs font-medium mb-1 block">Rango / Cargo</label>
          <input type="text" value={form.rango} onChange={(e) => update("rango", e.target.value)} placeholder="Sargento, Cabo, Civil, etc." className={inputCls} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-oro to-oro-light text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] mt-2 disabled:opacity-50 shadow-md"
        >
          {submitting ? "Registrando..." : "Registrarme como Lanza"}
        </button>

        <p className="text-gray-400 text-[10px] text-center">
          Al registrarte recibirás un link único para compartir con tus contactos
        </p>
      </form>
    </div>
  );
}
