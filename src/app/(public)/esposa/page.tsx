"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getComisionesPorTipo } from "@/lib/config";
import { toast } from "sonner";
import {
  Heart, Sparkles, ArrowRight, Check, Users, DollarSign,
  Clock, Shield, MessageCircle, Home, Award, Star,
  Phone, ChevronDown,
} from "lucide-react";

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function EsposaLandingPage() {
  const router = useRouter();
  const [comision, setComision] = useState(100000);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [code, setCode] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    email: "",
    ciudad: "",
  });

  useEffect(() => {
    getComisionesPorTipo().then((c) => setComision(c.esposa || 100000));
  }, []);

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.cedula.trim() || !form.telefono.trim()) {
      toast.error("Por favor llena nombre, cédula y teléfono");
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("/api/aliados/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rama: "Civil", rango: "", tipo: "esposa" }),
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
      toast.success("¡Bienvenida al programa!");
    } catch {
      toast.error("Error de conexión");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-arena via-white to-arena flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white border border-jungle/10 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-amber-100 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-oro" />
          </div>
          <div>
            <h2 className="text-jungle-dark text-2xl font-black">¡Bienvenida, {form.nombre.split(" ")[0]}!</h2>
            <p className="text-gray-600 text-sm mt-2">Tu cuenta como Aliada ya está activa</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-pink-50 border border-oro/20 rounded-2xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Tu código único</p>
            <p className="text-oro font-black text-3xl mt-1 tracking-wider">{code}</p>
          </div>

          <p className="text-gray-600 text-sm">
            Comparte tu link personalizado con amigas, familiares y conocidas militares.
            Por cada inscrita ganas <strong className="text-oro">{formatMoney(comision)}</strong>.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
                toast.success("Link copiado");
              }}
              className="w-full bg-gradient-to-r from-oro to-oro-light text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] shadow-lg shadow-oro/20"
            >
              Copiar mi link de referido
            </button>
            <button
              onClick={() => router.push(`/lanzas/panel?code=${code}`)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors"
            >
              Ir a mi panel
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Mira lo que encontré para nuestras familias militares: ${window.location.origin}/r/${code}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Compartir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arena">
      {/* ════════ HERO ════════ */}
      <section className="relative bg-gradient-to-br from-jungle-dark via-jungle to-jungle-dark overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/BgCamuflado.webp" alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-oro/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 py-12 sm:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-300/20 rounded-full px-4 py-1.5">
                <Heart className="w-4 h-4 text-pink-300" />
                <span className="text-pink-200 text-xs font-semibold tracking-wider uppercase">Programa Aliadas Legión</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Genera ingresos<br />
                <span className="text-oro">desde casa</span><br />
                protegiendo a los compañeros de tu pareja
              </h1>
              <p className="text-beige/70 text-base sm:text-lg leading-relaxed">
                Únete al programa de Aliadas de Legión Jurídica.
                Conectas a los compañeros militares o policías de tu pareja con asesoría legal real
                y ganas <strong className="text-oro">{formatMoney(comision)}</strong> por cada uno que se inscriba.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a href="#registro" className="inline-flex items-center gap-2 bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold px-6 py-3 rounded-full text-sm transition-all active:scale-95 hover:scale-105 shadow-xl shadow-oro/20">
                  Quiero ser Aliada <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#como-funciona" className="inline-flex items-center gap-2 bg-white/5 border border-white/20 text-white font-medium px-6 py-3 rounded-full text-sm hover:bg-white/10 transition-colors">
                  ¿Cómo funciona?
                </a>
              </div>
              <div className="flex items-center gap-4 pt-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-jungle-dark" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-jungle-dark" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-jungle-dark" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-jungle-dark" />
                </div>
                <p className="text-beige/60 text-xs">
                  Esposas de militares y policías ya están generando ingresos
                </p>
              </div>
            </div>

            {/* Visual right */}
            <div className="hidden md:block relative">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-300 to-amber-300 rounded-full" />
                    <div>
                      <p className="text-white text-sm font-bold">Tu progreso</p>
                      <p className="text-beige/40 text-xs">Este mes</p>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-oro" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-white">8</p>
                    <p className="text-beige/40 text-[10px]">Inscritos</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-green-400">5</p>
                    <p className="text-beige/40 text-[10px]">Pagaron</p>
                  </div>
                  <div className="bg-amber-500/10 border border-oro/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-oro">$500K</p>
                    <p className="text-beige/40 text-[10px]">Ganaste</p>
                  </div>
                </div>
                <div className="bg-pink-500/10 border border-pink-300/20 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-pink-200 text-xs font-bold">Bono al llegar a 10</p>
                    <p className="text-pink-200 text-[10px] font-bold">8/10</p>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-400 to-amber-400" style={{ width: "80%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ ¿CÓMO FUNCIONA? ════════ */}
      <section id="como-funciona" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-oro font-semibold text-xs sm:text-sm tracking-wider uppercase">3 pasos simples</span>
            <h2 className="text-3xl sm:text-4xl font-black text-jungle-dark mt-2 mb-3">¿Cómo funciona?</h2>
            <p className="text-gray-600 text-base max-w-xl mx-auto">
              Sin complicaciones, sin reuniones, sin metas obligatorias
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "1",
                icon: Sparkles,
                title: "Te registras gratis",
                desc: "En 2 minutos creas tu cuenta. Recibes un código único y tu link personalizado para compartir.",
                color: "from-pink-100 to-pink-50",
                iconColor: "text-pink-600",
              },
              {
                num: "2",
                icon: MessageCircle,
                title: "Compartes con los compañeros de tu pareja",
                desc: "Si tu esposo es militar, comparte el link con sus compañeros militares. Si es policía, con sus compañeros policías. WhatsApp, grupos del batallón, estación o unidad.",
                color: "from-amber-100 to-amber-50",
                iconColor: "text-oro",
              },
              {
                num: "3",
                icon: DollarSign,
                title: "Ganas comisión",
                desc: `Por cada militar o policía que se inscriba con tu link y pague el primer mes, ganas ${formatMoney(comision)}. Y si llegas a la meta, hay bono extra.`,
                color: "from-green-100 to-green-50",
                iconColor: "text-green-700",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="relative bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`w-14 h-14 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-7 h-7 ${s.iconColor}`} />
                  </div>
                  <div className="absolute top-6 right-6 text-5xl font-black text-gray-100">{s.num}</div>
                  <h3 className="text-jungle-dark text-lg font-bold mb-2">{s.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════ CALCULADORA ════════ */}
      <section className="py-16 bg-gradient-to-br from-jungle-dark via-jungle to-jungle-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-oro font-semibold text-xs sm:text-sm tracking-wider uppercase">Calcula tus ingresos</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 mb-3">¿Cuánto puedes ganar?</h2>
            <p className="text-beige/60 text-base max-w-xl mx-auto">
              Sin tope. Tu ingreso depende de cuántos compañeros de tu pareja se inscriban
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Esfuerzo bajo", inscritos: 3, desc: "Compartir el link con tres compañeros del batallón o estación" },
              { label: "Esfuerzo medio", inscritos: 7, desc: "Compartir en los grupos de WhatsApp de la unidad", popular: true },
              { label: "Esfuerzo alto", inscritos: 15, desc: "Toda la unidad + grupos de otras compañeras" },
            ].map((tier) => (
              <div
                key={tier.label}
                className={`relative rounded-3xl p-6 ${
                  tier.popular
                    ? "bg-gradient-to-b from-oro to-oro-light text-jungle-dark scale-105 shadow-2xl shadow-oro/30 border-2 border-oro"
                    : "bg-white/5 border border-white/10 text-white"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-jungle-dark text-oro text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Más común
                  </div>
                )}
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${tier.popular ? "text-jungle-dark/70" : "text-beige/50"}`}>
                  {tier.label}
                </p>
                <p className={`text-3xl font-black mb-1 ${tier.popular ? "text-jungle-dark" : "text-white"}`}>
                  {tier.inscritos} inscritos
                </p>
                <p className={`text-xs mb-4 ${tier.popular ? "text-jungle-dark/70" : "text-beige/50"}`}>
                  al mes
                </p>
                <div className={`text-2xl font-black ${tier.popular ? "text-jungle-dark" : "text-oro"}`}>
                  {formatMoney(tier.inscritos * comision)}
                </div>
                <p className={`text-xs ${tier.popular ? "text-jungle-dark/70" : "text-beige/50"}`}>
                  por mes
                </p>
                <div className={`mt-4 pt-4 border-t ${tier.popular ? "border-jungle-dark/20" : "border-white/10"}`}>
                  <p className={`text-xs ${tier.popular ? "text-jungle-dark/80" : "text-beige/60"}`}>
                    {tier.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-beige/40 text-xs mt-8">
            * Ingreso variable. No es un MLM. Sin metas obligatorias. Sin penalizaciones.
          </p>
        </div>
      </section>

      {/* ════════ ¿POR QUÉ? ════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-oro font-semibold text-xs sm:text-sm tracking-wider uppercase">Por qué este programa</span>
            <h2 className="text-3xl sm:text-4xl font-black text-jungle-dark mt-2 mb-3">
              Pensado para ti
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: Home, title: "Trabaja desde casa", desc: "Sin oficinas, sin desplazamientos. Tu celular es todo lo que necesitas." },
              { icon: Clock, title: "Sin horarios fijos", desc: "Trabaja cuando puedas. Tu familia siempre va primero." },
              { icon: Heart, title: "Protege a los compañeros de tu pareja", desc: "Conecta a los militares o policías que conoces con asesoría legal real cuando más la necesitan." },
              { icon: Shield, title: "Empresa real, no MLM", desc: "Legión Jurídica es una firma legal establecida. No vendes productos, conectas a quienes ya conoces." },
              { icon: DollarSign, title: "Pagos puntuales", desc: "Cada inscripción confirmada se te abona a fin de mes. Sin retrasos, sin excusas." },
              { icon: Award, title: "Bonos por cumplimiento", desc: "Llegando a metas específicas recibes bonos extra encima de tu comisión normal." },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="flex items-start gap-4 p-5 bg-arena rounded-2xl border border-jungle/5 hover:border-oro/30 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-oro" />
                  </div>
                  <div>
                    <h3 className="text-jungle-dark font-bold text-base mb-1">{b.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════ TESTIMONIOS ════════ */}
      <section className="py-16 bg-arena">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-oro font-semibold text-xs sm:text-sm tracking-wider uppercase">Lo que dicen ellas</span>
            <h2 className="text-3xl sm:text-4xl font-black text-jungle-dark mt-2 mb-3">Mujeres como tú</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: "María Camila",
                role: "Esposa de patrullero",
                quote: "Le compartí el link a varios compañeros de mi esposo en la estación. En 2 meses ya iba por 8 inscritos. El ingreso extra ayudó muchísimo.",
                emoji: "🌸",
              },
              {
                name: "Diana Patricia",
                role: "Esposa de cabo del Ejército",
                quote: "Lo que más me gusta es que estoy protegiendo a los compañeros de mi esposo. Saber que ellos también tienen respaldo legal cuando lo necesitan.",
                emoji: "💝",
              },
              {
                name: "Lucía Fernanda",
                role: "Esposa de sargento",
                quote: "Pensé que sería complicado pero fue muy fácil. Solo comparto el link en los grupos de WhatsApp del batallón de mi esposo.",
                emoji: "✨",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-oro text-oro" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed italic mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-amber-100 rounded-full flex items-center justify-center text-xl">
                    {t.emoji}
                  </div>
                  <div>
                    <p className="text-jungle-dark font-bold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FAQ ════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-oro font-semibold text-xs sm:text-sm tracking-wider uppercase">Preguntas frecuentes</span>
            <h2 className="text-3xl sm:text-4xl font-black text-jungle-dark mt-2 mb-3">Resuelve tus dudas</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "¿Tengo que pagar algo para registrarme?",
                a: "No. Es 100% gratis. No hay inversión, no hay membresía, no hay cuotas. Solo te registras y empiezas a compartir.",
              },
              {
                q: "¿Cuándo me pagan?",
                a: `Cada vez que un militar o policía se inscribe con tu link y paga su primer mes de plan, te abonamos ${formatMoney(comision)}. Los pagos se hacen una vez al mes.`,
              },
              {
                q: "¿A quién le comparto el link?",
                a: "A los compañeros de tu pareja. Si tu esposo es militar, comparte con sus compañeros militares (del batallón, brigada o unidad). Si es policía, con sus compañeros policías (de la estación o departamento).",
              },
              {
                q: "¿Y si el compañero que inscribí no paga?",
                a: "Solo cobras cuando la persona efectivamente paga su primer mes. Si no paga, no hay comisión, pero tampoco te penalizan.",
              },
              {
                q: "¿Puedo dejar de hacerlo cuando quiera?",
                a: "Claro. No hay contratos ni compromisos. Si decides parar, simplemente paras. Tus comisiones ya ganadas se te pagan igual.",
              },
              {
                q: "¿Qué es un bono por cumplimiento?",
                a: "Es un monto extra que ganas cuando llegas a una meta de inscripciones (por ejemplo, 10 compañeros inscritos). El monto y la meta los acordamos contigo.",
              },
              {
                q: "¿Cómo sé cuántas personas se inscribieron con mi link?",
                a: "Tienes un panel personal donde ves en tiempo real todas las personas que se registraron, en qué estado están, y cuánto vas ganando.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-arena border border-gray-200 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-amber-50 transition-colors"
                >
                  <span className="text-jungle-dark font-bold text-sm">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-oro flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FORM REGISTRO ════════ */}
      <section id="registro" className="py-16 bg-gradient-to-br from-jungle-dark via-jungle to-jungle-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-oro/10 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-300/20 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-pink-300" />
              <span className="text-pink-200 text-xs font-semibold tracking-wider uppercase">Es gratis</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              ¿Lista para empezar?
            </h2>
            <p className="text-beige/60 text-base max-w-md mx-auto">
              Completa estos datos en menos de 2 minutos y empieza a proteger a los compañeros de tu pareja
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div>
              <label className="text-gray-600 text-xs font-bold mb-1.5 block uppercase tracking-wider">Nombre completo *</label>
              <input
                type="text" required value={form.nombre}
                onChange={(e) => update("nombre", e.target.value)}
                placeholder="Tu nombre y apellido"
                className="w-full bg-arena text-jungle-dark placeholder-gray-400 text-base px-4 py-3 rounded-xl border border-gray-200 focus:border-oro focus:outline-none focus:ring-2 focus:ring-oro/20"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-600 text-xs font-bold mb-1.5 block uppercase tracking-wider">Cédula *</label>
                <input
                  type="text" required value={form.cedula}
                  onChange={(e) => update("cedula", e.target.value.replace(/\D/g, ""))}
                  placeholder="12345678" inputMode="numeric"
                  className="w-full bg-arena text-jungle-dark placeholder-gray-400 text-base px-4 py-3 rounded-xl border border-gray-200 focus:border-oro focus:outline-none focus:ring-2 focus:ring-oro/20"
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-bold mb-1.5 block uppercase tracking-wider">Teléfono *</label>
                <input
                  type="tel" required value={form.telefono}
                  onChange={(e) => update("telefono", e.target.value.replace(/\D/g, ""))}
                  placeholder="3176689580" inputMode="numeric"
                  className="w-full bg-arena text-jungle-dark placeholder-gray-400 text-base px-4 py-3 rounded-xl border border-gray-200 focus:border-oro focus:outline-none focus:ring-2 focus:ring-oro/20"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-600 text-xs font-bold mb-1.5 block uppercase tracking-wider">Email</label>
                <input
                  type="email" value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-arena text-jungle-dark placeholder-gray-400 text-base px-4 py-3 rounded-xl border border-gray-200 focus:border-oro focus:outline-none focus:ring-2 focus:ring-oro/20"
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-bold mb-1.5 block uppercase tracking-wider">Ciudad</label>
                <input
                  type="text" value={form.ciudad}
                  onChange={(e) => update("ciudad", e.target.value)}
                  placeholder="Bogotá"
                  className="w-full bg-arena text-jungle-dark placeholder-gray-400 text-base px-4 py-3 rounded-xl border border-gray-200 focus:border-oro focus:outline-none focus:ring-2 focus:ring-oro/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-oro to-oro-light text-white font-black py-4 rounded-xl text-base transition-all active:scale-[0.98] hover:shadow-xl hover:shadow-oro/30 mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                "Registrando..."
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Quiero ser Aliada
                </>
              )}
            </button>

            <p className="text-gray-400 text-[11px] text-center">
              Al registrarte aceptas el tratamiento de tus datos según la Ley 1581 de 2012
            </p>
          </form>

          <div className="text-center mt-6">
            <p className="text-beige/40 text-xs">¿Ya tienes cuenta?{" "}
              <Link href="/lanzas" className="text-oro hover:text-oro-light underline">Ingresa aquí</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="bg-jungle-dark border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2.5">
            <Image src="/images/logo.svg" alt="Legión Jurídica" width={28} height={28} />
            <div className="flex items-center gap-1">
              <span className="text-white font-black text-sm tracking-[0.12em]">LEGIÓN</span>
              <span className="text-oro font-black text-sm tracking-[0.12em]">JURÍDICA</span>
            </div>
          </div>
          <p className="text-beige/40 text-xs">
            Programa de Aliadas — Asesoría legal para Fuerzas Militares y Policía Nacional
          </p>
          <a
            href="https://wa.me/573176689580"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-beige/60 text-xs hover:text-oro transition-colors"
          >
            <Phone className="w-3 h-3" /> 317 668 9580
          </a>
        </div>
      </footer>
    </div>
  );
}
