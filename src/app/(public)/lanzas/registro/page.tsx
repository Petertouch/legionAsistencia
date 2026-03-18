"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { UserPlus, Check } from "lucide-react";

const RAMAS = ["Ejército", "Policía", "Armada", "Fuerza Aérea", "Civil", "Otro"];

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function LanzaRegistroPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [code, setCode] = useState("");
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
    const supabase = createClient();

    // Check duplicate cedula
    const { data: existing } = await supabase
      .from("lanzas")
      .select("id")
      .eq("cedula", form.cedula.trim())
      .single();

    if (existing) {
      toast.error("Ya existe un Lanza con esa cédula. Ingresa desde el portal.");
      setSubmitting(false);
      return;
    }

    const newCode = generateCode();
    const { error } = await supabase.from("lanzas").insert({
      code: newCode,
      nombre: form.nombre.trim(),
      cedula: form.cedula.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      ciudad: form.ciudad.trim(),
      rama: form.rama,
      rango: form.rango.trim(),
      suscriptor_id: null,
      status: "activo",
    });

    if (error) {
      toast.error("Error al registrar. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    setCode(newCode);
    setSuccess(true);
    setSubmitting(false);
    toast.success("¡Registro exitoso!");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-jungle-dark flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-white text-xl font-bold">¡Bienvenido a los Lanzas!</h2>
          <p className="text-beige/60 text-sm">
            Tu código único es: <span className="text-oro font-bold text-lg">{code}</span>
          </p>
          <p className="text-beige/50 text-xs">
            Comparte tu link personalizado con tus contactos y gana $50.000 por cada cliente que se afilie.
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => router.push(`/lanzas/panel?code=${code}`)}
              className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
            >
              Ir a mi panel
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
                toast.success("Link copiado");
              }}
              className="w-full bg-white/5 border border-white/10 text-beige/70 font-medium py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors"
            >
              Copiar mi link de referidos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jungle-dark pt-24 pb-16 px-4 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-oro/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <UserPlus className="w-7 h-7 text-oro" />
        </div>
        <h1 className="text-white text-2xl font-bold">Sé un Lanza</h1>
        <p className="text-beige/50 text-sm mt-1">
          Regístrate y gana <span className="text-oro font-bold">$50.000</span> por cada persona que afiliemos gracias a ti
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div>
          <label className="text-beige/60 text-xs font-medium mb-1 block">Nombre completo *</label>
          <input
            type="text" required value={form.nombre}
            onChange={(e) => update("nombre", e.target.value)}
            placeholder="Tu nombre y apellido"
            className="w-full bg-white/5 text-white placeholder-beige/30 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-beige/60 text-xs font-medium mb-1 block">Cédula *</label>
            <input
              type="text" required value={form.cedula}
              onChange={(e) => update("cedula", e.target.value.replace(/\D/g, ""))}
              placeholder="12345678" inputMode="numeric"
              className="w-full bg-white/5 text-white placeholder-beige/30 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-beige/60 text-xs font-medium mb-1 block">Teléfono *</label>
            <input
              type="tel" required value={form.telefono}
              onChange={(e) => update("telefono", e.target.value.replace(/\D/g, ""))}
              placeholder="3176689580" inputMode="numeric"
              className="w-full bg-white/5 text-white placeholder-beige/30 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-beige/60 text-xs font-medium mb-1 block">Email</label>
          <input
            type="email" value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="correo@ejemplo.com"
            className="w-full bg-white/5 text-white placeholder-beige/30 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-beige/60 text-xs font-medium mb-1 block">Ciudad</label>
            <input
              type="text" value={form.ciudad}
              onChange={(e) => update("ciudad", e.target.value)}
              placeholder="Bogotá"
              className="w-full bg-white/5 text-white placeholder-beige/30 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-beige/60 text-xs font-medium mb-1 block">Rama</label>
            <select
              value={form.rama}
              onChange={(e) => update("rama", e.target.value)}
              className="w-full bg-white/5 text-beige/70 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none appearance-none cursor-pointer"
            >
              {RAMAS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-beige/60 text-xs font-medium mb-1 block">Rango / Cargo</label>
          <input
            type="text" value={form.rango}
            onChange={(e) => update("rango", e.target.value)}
            placeholder="Sargento, Cabo, Civil, etc."
            className="w-full bg-white/5 text-white placeholder-beige/30 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
        >
          {submitting ? "Registrando..." : "Registrarme como Lanza"}
        </button>

        <p className="text-beige/30 text-[10px] text-center">
          Al registrarte recibirás un link único para compartir con tus contactos
        </p>
      </form>
    </div>
  );
}
