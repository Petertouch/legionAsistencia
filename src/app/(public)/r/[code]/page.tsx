"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { useLanzaStore } from "@/lib/stores/lanza-store";
import { Shield, Check, MessageCircle, Phone, Star } from "lucide-react";
import { toast } from "sonner";

const PLANES = [
  {
    name: "Base",
    price: "50.000",
    color: "border-green-500/30 bg-green-500/5",
    badge: "bg-green-500/20 text-green-400",
    features: [
      "Asesoría jurídica ilimitada (WhatsApp, llamada)",
      "Revisión de documentos (1/mes)",
      "Derecho de petición incluido",
    ],
  },
  {
    name: "Plus",
    price: "66.000",
    color: "border-blue-500/30 bg-blue-500/5",
    badge: "bg-blue-500/20 text-blue-400",
    popular: true,
    features: [
      "Todo lo del Plan Base",
      "2 revisiones de documentos/mes",
      "Acompañamiento a audiencias (1/semestre)",
      "Consulta familiar incluida",
    ],
  },
  {
    name: "Élite",
    price: "80.000",
    color: "border-oro/30 bg-oro/5",
    badge: "bg-oro/20 text-oro",
    features: [
      "Todo lo del Plan Plus",
      "Documentos ilimitados",
      "Audiencias ilimitadas",
      "Línea prioritaria 24/7",
      "Cobertura grupo familiar",
    ],
  },
];

const AREAS = ["Penal Militar", "Disciplinario", "Familia", "Documentos", "Consumidor", "Civil", "Otro"];

interface Props {
  params: Promise<{ code: string }>;
}

export default function ReferralPage({ params }: Props) {
  const { code } = use(params);
  const { getLanzaByCode, addLead } = useLanzaStore();
  const [mounted, setMounted] = useState(false);
  const [plan, setPlan] = useState("Base");
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    cedula: "",
    area_interes: "Penal Militar",
    mensaje: "",
  });

  useEffect(() => { setMounted(true); }, []);

  const lanza = mounted ? getLanzaByCode(code) : null;

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Register lead in the store
    if (lanza) {
      addLead({
        lanza_id: lanza.id,
        lanza_code: lanza.code,
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        cedula: form.cedula.trim(),
        area_interes: form.area_interes,
        plan_interes: plan,
        mensaje: form.mensaje.trim(),
      });
    }

    // Also open WhatsApp
    const msg = `Hola, quiero afiliarme al Plan ${plan}. Mi nombre es ${form.nombre}, tel: ${form.telefono}. Código: ${code}`;
    window.open(`https://wa.me/573176689580?text=${encodeURIComponent(msg)}`, "_blank");

    setSent(true);
    toast.success("¡Registro enviado!");
  };

  return (
    <div className="min-h-screen bg-jungle-dark">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2.5">
          <Image src="/images/logo.svg" alt="Legion Juridica" width={32} height={32} />
          <div className="flex items-center gap-1">
            <span className="text-white font-black text-base tracking-[0.12em]">LEGIÓN</span>
            <span className="text-oro font-black text-base tracking-[0.12em]">JURÍDICA</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
        {/* Lanza banner */}
        {lanza && (
          <div className="bg-oro/10 border border-oro/20 rounded-xl p-4 text-center">
            <p className="text-oro text-sm font-medium">
              <strong>{lanza.nombre}</strong> te invitó a Legión Jurídica
            </p>
          </div>
        )}

        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight">
            Tu abogado en el bolsillo,<br />
            <span className="text-oro">24/7</span>
          </h1>
          <p className="text-beige/60 text-sm md:text-base max-w-md mx-auto">
            Asistencia legal por suscripción para militares y policías de Colombia. Sin citas. Sin filas. Sin letra pequeña.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: "⚖️", text: "Penal Militar" },
            { icon: "🛡️", text: "Disciplinarios" },
            { icon: "👨‍👩‍👧", text: "Familia" },
            { icon: "📄", text: "Documentos" },
          ].map((b) => (
            <div key={b.text} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <span className="text-xl">{b.icon}</span>
              <p className="text-beige/70 text-xs mt-1">{b.text}</p>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div>
          <h2 className="text-white text-lg font-bold text-center mb-4">Elige tu plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PLANES.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setPlan(p.name)}
                className={`relative text-left rounded-xl border p-4 transition-all ${
                  plan === p.name
                    ? "border-oro bg-oro/10 ring-1 ring-oro/30"
                    : p.color + " hover:border-white/20"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 right-3 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Popular
                  </span>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.badge}`}>
                    {p.name}
                  </span>
                  {plan === p.name && <Check className="w-4 h-4 text-oro" />}
                </div>
                <p className="text-white text-xl font-bold">
                  ${p.price}<span className="text-beige/40 text-xs font-normal">/mes</span>
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-1.5 text-beige/60 text-xs">
                      <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* Registration form */}
        {!sent ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-oro" /> Regístrate ahora
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
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
                  <label className="text-beige/60 text-xs font-medium mb-1 block">Teléfono *</label>
                  <input
                    type="tel" required value={form.telefono}
                    onChange={(e) => update("telefono", e.target.value.replace(/\D/g, ""))}
                    placeholder="3176689580" inputMode="numeric"
                    className="w-full bg-white/5 text-white placeholder-beige/30 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-beige/60 text-xs font-medium mb-1 block">Cédula</label>
                  <input
                    type="text" value={form.cedula}
                    onChange={(e) => update("cedula", e.target.value.replace(/\D/g, ""))}
                    placeholder="12345678" inputMode="numeric"
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
              <div>
                <label className="text-beige/60 text-xs font-medium mb-1 block">¿En qué área necesitas ayuda?</label>
                <select
                  value={form.area_interes}
                  onChange={(e) => update("area_interes", e.target.value)}
                  className="w-full bg-white/5 text-beige/70 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none appearance-none cursor-pointer"
                >
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-beige/60 text-xs font-medium mb-1 block">Cuéntanos tu situación (opcional)</label>
                <textarea
                  value={form.mensaje}
                  onChange={(e) => update("mensaje", e.target.value)}
                  placeholder="Describe brevemente tu caso..."
                  rows={3}
                  className="w-full bg-white/5 text-white placeholder-beige/30 text-sm px-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none resize-none"
                />
              </div>
              <div className="bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-beige/50 text-xs">Plan seleccionado</span>
                <span className="text-oro font-bold text-sm">{plan} — ${PLANES.find((p) => p.name === plan)?.price}/mes</span>
              </div>
              {lanza && (
                <div className="bg-oro/5 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-beige/50 text-xs">Referido por</span>
                  <span className="text-oro text-xs font-medium">{lanza.nombre}</span>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5" /> Registrarme y contactar por WhatsApp
              </button>
              <p className="text-beige/30 text-[10px] text-center">
                Tus datos quedan registrados y también se abrirá WhatsApp para contacto directo
              </p>
            </form>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center space-y-3">
            <Check className="w-10 h-10 text-green-400 mx-auto" />
            <h3 className="text-white font-bold text-lg">¡Registro exitoso!</h3>
            <p className="text-beige/60 text-sm">
              Un abogado te contactará por WhatsApp para completar tu afiliación al <strong className="text-white">Plan {plan}</strong>.
            </p>
            <a
              href="https://wa.me/573176689580"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
            </a>
          </div>
        )}

        {/* Trust */}
        <div className="text-center space-y-2 pb-6">
          <div className="flex items-center justify-center gap-4 text-beige/40 text-xs">
            <a href="tel:+573176689580" className="flex items-center gap-1 hover:text-oro transition-colors">
              <Phone className="w-3 h-3" /> 317 668 9580
            </a>
            <span>•</span>
            <span>Bogotá, Colombia</span>
          </div>
          <p className="text-beige/20 text-[10px]">
            Legión Jurídica © {new Date().getFullYear()} — Servicio legal para la fuerza pública
          </p>
        </div>
      </main>
    </div>
  );
}
