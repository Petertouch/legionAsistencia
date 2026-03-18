"use client";

import Image from "next/image";
import { Reveal, Stagger, StaggerItem, CountUp, ScaleReveal } from "@/components/motion";

export default function Home() {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/soldados.webp"
            alt="Soldados de Colombia"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-jungle-dark/90 via-jungle-dark/80 to-jungle-dark sm:bg-gradient-to-r sm:from-jungle-dark/95 sm:via-jungle-dark/85 sm:to-jungle-dark/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-jungle-dark via-transparent to-jungle-dark/40" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <Reveal delay={0.2} direction="up">
                <div className="inline-flex items-center gap-2 bg-oro/10 border border-oro/20 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-5 sm:mb-8">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-oro rounded-full animate-pulse" />
                  <span className="text-oro text-[11px] sm:text-sm font-semibold tracking-wide">
                    + 8,000 CASOS RESUELTOS
                  </span>
                </div>
              </Reveal>

              <Reveal delay={0.4} direction="up">
                <h1 className="text-[2rem] leading-[1.15] sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white sm:leading-[1.1] mb-4 sm:mb-6">
                  Tu misión es{" "}
                  <span className="text-gradient">servir a la patria.</span>
                  <br />
                  <span className="text-white/90 text-xl sm:text-4xl lg:text-5xl">
                    La nuestra es protegerte.
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={0.6} direction="up">
                <p className="text-[15px] sm:text-lg lg:text-xl text-beige/70 max-w-xl mb-7 sm:mb-10 leading-relaxed">
                  Asesoría jurídica ilimitada para militares y policías.
                  Un abogado siempre disponible para ti y tu familia,
                  desde <span className="text-oro font-bold">$50.000/mes</span>.
                </p>
              </Reveal>

              <Reveal delay={0.8} direction="up">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <a
                    href="https://wa.me/573176689580"
                    target="_blank"
                    className="group bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-full text-[15px] sm:text-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-xl shadow-oro/25 flex items-center justify-center gap-2.5"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Afíliate por WhatsApp
                  </a>
                  <a
                    href="#planes"
                    className="border-2 border-white/20 active:border-oro/50 sm:hover:border-oro/50 text-white font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-full text-[15px] sm:text-lg transition-all duration-300 text-center"
                  >
                    Ver Planes
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Desktop stats card */}
            <Reveal direction="right" delay={0.6} className="hidden lg:block">
              <div className="glass rounded-3xl p-8 animate-float">
                <Image
                  src="/images/logo.svg"
                  alt="Escudo Legión Jurídica"
                  width={120}
                  height={120}
                  className="mx-auto mb-6 drop-shadow-[0_0_30px_rgba(194,150,19,0.3)]"
                />
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: "24/7", label: "Disponibilidad total" },
                    { value: "8K+", label: "Casos resueltos" },
                    { value: "$50K", label: "Desde al mes" },
                    { value: "100%", label: "Confidencial" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-4 rounded-xl bg-white/5">
                      <div className="text-2xl font-black text-oro">{stat.value}</div>
                      <div className="text-beige/50 text-xs mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Mobile stats row */}
          <Stagger className="lg:hidden grid grid-cols-4 gap-2 sm:gap-3 mt-8 sm:mt-12" staggerDelay={0.1}>
            {[
              { value: "24/7", label: "Disponible" },
              { value: "8K+", label: "Casos" },
              { value: "$50K", label: "Desde/mes" },
              { value: "100%", label: "Confidencial" },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="glass rounded-xl p-2.5 sm:p-3 text-center">
                  <div className="text-base sm:text-lg font-black text-oro">{stat.value}</div>
                  <div className="text-beige/50 text-[9px] sm:text-[10px] mt-0.5">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
          <svg className="w-5 h-5 text-oro/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ============ SOCIAL PROOF BAR ============ */}
      <section className="bg-jungle py-4 sm:py-6 border-y border-oro/10 overflow-hidden">
        <div className="relative">
          <div className="hidden sm:flex max-w-7xl mx-auto px-4 flex-wrap items-center justify-center gap-6 md:gap-12 lg:gap-16">
            {["Fuerzas Militares", "Policía Nacional", "Ejército Nacional", "Armada Nacional", "Fuerza Aérea"].map((org) => (
              <span key={org} className="text-beige/25 text-xs sm:text-sm font-medium tracking-wider uppercase whitespace-nowrap">
                {org}
              </span>
            ))}
          </div>
          <div className="sm:hidden flex animate-marquee">
            {[...Array(2)].map((_, repeat) => (
              <div key={repeat} className="flex gap-8 px-4">
                {["Fuerzas Militares", "Policía Nacional", "Ejército Nacional", "Armada Nacional", "Fuerza Aérea"].map((org) => (
                  <span key={`${repeat}-${org}`} className="text-beige/25 text-xs font-medium tracking-wider uppercase whitespace-nowrap">
                    {org}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROBLEMA / SOLUCIÓN ============ */}
      <section id="problema" className="py-8 sm:py-14 overflow-hidden">
        {/* SIN LEGION - fondo oscuro */}
        <div className="bg-jungle-dark relative">
          <div className="absolute inset-0 opacity-5">
            <Image src="/images/BgCamuflado.webp" alt="" fill sizes="100vw" className="object-cover" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-20">
            <Reveal direction="left">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white">
                  Sin Legión, enfrentas esto solo
                </h2>
              </div>
            </Reveal>

            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" staggerDelay={0.08}>
              {[
                {
                  title: "Citacion a descargos",
                  desc: "Te llega un documento y no sabes si responder, ir o callar. El reloj corre.",
                  icon: (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  ),
                },
                {
                  title: "Proceso disciplinario",
                  desc: "Tu carrera de anos puede terminar por un proceso mal manejado.",
                  icon: (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  ),
                },
                {
                  title: "Abogado por caso = caro",
                  desc: "Cada consulta te cuesta $200.000 o más. Y cuando más lo necesitas, no tienes.",
                  icon: (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  ),
                },
                {
                  title: "Problemas familiares",
                  desc: "Divorcio, custodia, alimentos... y tu en operaciones sin poder atender nada.",
                  icon: (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                  ),
                },
                {
                  title: "Documentos legales",
                  desc: "Tutelas, derechos de peticion, contratos... no sabes redactarlos ni a quien acudir.",
                  icon: (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  ),
                },
                {
                  title: "Sin prevencion",
                  desc: "Cuando el problema llega, ya es tarde para buscar ayuda. Y los terminos no esperan.",
                  icon: (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
              ].map((problem, i) => (
                <StaggerItem key={i}>
                  <div className="group bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 sm:hover:bg-white/10 transition-all duration-300 h-full">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                        {problem.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm sm:text-base mb-1">{problem.title}</h3>
                        <p className="text-beige/50 text-xs sm:text-sm leading-relaxed">{problem.desc}</p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>

        {/* CON LEGION - fondo blanco */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-20">
            <Reveal direction="right">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-jungle">
                  Con Legión, todo cambia
                </h2>
              </div>
            </Reveal>

            <Stagger className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" staggerDelay={0.08}>
              {[
                { title: "Abogado asignado", desc: "Uno que conoce tu caso, tu contexto militar y tu historial" },
                { title: "Consultas ilimitadas", desc: "Pregunta lo que necesites por WhatsApp, llamada o en persona" },
                { title: "Siempre disponible", desc: "No importa si estas en operaciones, base o licencia" },
                { title: "Tu familia cubierta", desc: "Tu plan protege también a tu esposa e hijos" },
                { title: "Respuesta inmediata", desc: "No esperas semanas. Te responden cuando lo necesitas" },
                { title: "Desde $50.000/mes", desc: "Menos de lo que cuesta una sola consulta particular" },
              ].map((benefit, i) => (
                <StaggerItem key={i}>
                  <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-arena border border-arena-dark sm:hover:shadow-md sm:hover:border-oro/20 transition-all duration-300 h-full">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-jungle flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-oro" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-jungle text-sm sm:text-base">{benefit.title}</h3>
                      <p className="text-gray-500 text-xs sm:text-sm leading-snug mt-0.5">{benefit.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            {/* Quote banner with abogado photo */}
            <Reveal direction="up" delay={0.2}>
              <div className="mt-8 sm:mt-10 bg-jungle rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-oro/30 ring-offset-2 ring-offset-jungle">
                  <Image
                    src="/images/abogado.webp"
                    alt="Abogado Legión Jurídica"
                    fill
                    sizes="80px"
                    className="object-cover object-top"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-white font-bold text-sm sm:text-lg leading-snug">
                    &ldquo;Tu misión es servir a la patria. Déjanos a nosotros lo legal.&rdquo;
                  </p>
                  <p className="text-oro text-xs sm:text-sm mt-1">Equipo Legión Jurídica</p>
                </div>
                <a
                  href="https://wa.me/573176689580"
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-full text-sm sm:text-base transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-lg shadow-oro/20 whitespace-nowrap flex-shrink-0"
                >
                  Quiero mi escudo legal
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ COMO FUNCIONA ============ */}
      <section id="como-funciona" className="py-8 sm:py-14 bg-arena relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url('/images/BgCamuflado.webp')", backgroundSize: "cover" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal direction="up">
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-oro font-semibold text-xs sm:text-sm tracking-wider uppercase">
                Simple y directo
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-jungle mt-2 sm:mt-3 mb-3 sm:mb-5">
                Así de fácil funciona
              </h2>
              <p className="text-sm sm:text-lg text-gray-500">
                En 3 pasos ya tienes tu escudo legal activo
              </p>
            </div>
          </Reveal>

          <Stagger className="grid sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 relative" staggerDelay={0.15}>
            <div className="hidden sm:block absolute top-24 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-oro/20 via-oro to-oro/20" />

            {[
              {
                step: "01", title: "Elige tu plan",
                desc: "Base, Plus o Elite. Todos incluyen asesoria ilimitada. Escoge segun tus necesidades.",
                icon: (
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                ),
              },
              {
                step: "02", title: "Te asignamos abogado",
                desc: "Un abogado especializado que conoce tu situación y el contexto militar.",
                icon: (
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                ),
              },
              {
                step: "03", title: "Consulta sin limites",
                desc: "WhatsApp, llamada o en persona. Sin citas previas. Tu abogado siempre esta ahi.",
                icon: (
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                ),
              },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="relative bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm sm:hover:shadow-xl transition-all duration-500 group sm:hover:-translate-y-2 flex sm:block items-start gap-4 sm:gap-0 h-full">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-oro to-oro-light rounded-xl sm:rounded-2xl flex items-center justify-center text-jungle-dark flex-shrink-0 sm:mb-6 shadow-lg shadow-oro/20">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="hidden sm:block absolute top-6 right-6 text-6xl font-black text-arena-dark group-hover:text-oro/10 transition-colors">
                      {item.step}
                    </div>
                    <h3 className="text-base sm:text-xl font-bold text-jungle mb-1 sm:mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed text-xs sm:text-base">{item.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============ COBERTURA ============ */}
      <section id="cobertura" className="py-8 sm:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <Reveal direction="up">
                <span className="text-oro font-semibold text-xs sm:text-sm tracking-wider uppercase">
                  Cobertura completa
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-jungle mt-2 sm:mt-3 mb-3 sm:mb-5">
                  Todo lo que necesitas, en un solo plan
                </h2>
                <p className="text-sm sm:text-lg text-gray-500 mb-6 sm:mb-10">
                  No importa si es penal, disciplinario o familiar. Tu plan lo cubre.
                </p>
              </Reveal>

              <Stagger className="grid grid-cols-2 gap-3 sm:gap-4" staggerDelay={0.08}>
                {[
                  { title: "Derecho Penal", desc: "Procesos penales militares y ordinarios", color: "from-red-500/10 to-red-500/5" },
                  { title: "Disciplinario", desc: "Descargos e investigaciones", color: "from-orange-500/10 to-orange-500/5" },
                  { title: "Familia", desc: "Divorcio, custodia, alimentos", color: "from-pink-500/10 to-pink-500/5" },
                  { title: "Civil", desc: "Contratos, deudas, arrendamientos", color: "from-blue-500/10 to-blue-500/5" },
                  { title: "Consumidor", desc: "Garantias y reclamos", color: "from-green-500/10 to-green-500/5" },
                  { title: "Documentos", desc: "Tutelas, peticiones, poderes", color: "from-purple-500/10 to-purple-500/5" },
                ].map((area) => (
                  <StaggerItem key={area.title}>
                    <div
                      className={`bg-gradient-to-br ${area.color} rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-gray-100 active:shadow-md sm:hover:shadow-md transition-all duration-300 h-full`}
                    >
                      <h3 className="font-bold text-jungle text-sm sm:text-base mb-0.5 sm:mb-1">{area.title}</h3>
                      <p className="text-gray-500 text-[11px] sm:text-sm leading-snug">{area.desc}</p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>

            <Reveal direction="right" delay={0.2} className="relative order-first lg:order-last">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl aspect-[16/10] sm:aspect-[4/3] lg:aspect-[4/5] max-h-[220px] sm:max-h-[350px] lg:max-h-[520px]">
                <Image
                  src="/images/familia.webp"
                  alt="Legión Jurídica protege a tu familia"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-[center_20%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-jungle-dark/60 via-transparent to-transparent" />
              </div>
              <ScaleReveal delay={0.5} className="absolute -bottom-3 left-3 sm:-bottom-5 sm:left-4 lg:-bottom-6 lg:-left-6 z-10">
                <div className="bg-jungle text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
                  <div className="flex items-center gap-2 sm:gap-3 lg:block">
                    <div className="text-lg sm:text-2xl lg:text-3xl font-black text-oro lg:mb-1">
                      <CountUp target={100} suffix="%" />
                    </div>
                    <p className="text-beige/80 text-[10px] sm:text-xs lg:text-sm leading-snug max-w-[140px] sm:max-w-[180px] lg:max-w-xs">
                      Nuestros planes cubren a tu familia directa
                    </p>
                  </div>
                </div>
              </ScaleReveal>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ PLANES ============ */}
      <section id="planes" className="py-8 sm:py-14 bg-jungle-dark relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/BgCamuflado.webp" alt="" fill sizes="100vw" className="object-cover opacity-10" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-jungle-dark via-jungle-dark/95 to-jungle-dark" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal direction="up">
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-oro font-semibold text-xs sm:text-sm tracking-wider uppercase">
                Planes accesibles
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-2 sm:mt-3 mb-3 sm:mb-5">
                Menos de lo que gastas en recargas
              </h2>
              <p className="text-sm sm:text-lg text-beige/50 max-w-xl mx-auto">
                Pero con un abogado siempre disponible para ti y tu familia
              </p>
            </div>
          </Reveal>

          <Stagger
            className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-start overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-4 sm:pb-0 -mx-5 px-5 sm:mx-0 sm:px-0"
            staggerDelay={0.15}
          >
            {[
              {
                name: "Base", price: "50.000", monthly: "$1.700/dia",
                features: ["Asesoría jurídica ilimitada", "2 representaciones / año", "4 opiniones / mes", "Revisión de documentos", "Atención por WhatsApp"],
                popular: false, cta: "Empezar con Base",
              },
              {
                name: "Plus", price: "66.000", monthly: "$2.200/dia",
                features: ["Todo lo del Base, más:", "3 representaciones / año", "8 opiniones / mes", "Prioridad en asignación", "WhatsApp y llamada"],
                popular: true, cta: "Elegir Plus",
              },
              {
                name: "Elite", price: "80.000", monthly: "$2.700/dia",
                features: ["Todo lo del Plus, mas:", "5 representaciones / año", "Opiniones ILIMITADAS", "Abogado dedicado", "Atención prioritaria 24/7"],
                popular: false, cta: "Ir por Elite",
              },
            ].map((plan) => (
              <StaggerItem key={plan.name} direction="up">
                <div
                  className={`relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-500 sm:hover:-translate-y-2 snap-center flex-shrink-0 w-[280px] sm:w-auto ${
                    plan.popular
                      ? "bg-gradient-to-b from-oro to-oro-light text-jungle-dark shadow-2xl shadow-oro/20 ring-2 ring-oro/50 sm:scale-105 z-10"
                      : "bg-white/5 text-white border border-white/10 sm:hover:border-oro/30"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-jungle-dark text-oro text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 sm:px-4 py-1 sm:py-1.5 rounded-full whitespace-nowrap">
                      Más popular
                    </div>
                  )}
                  <h3 className="text-xl sm:text-2xl font-black mb-0.5">{plan.name}</h3>
                  <p className={`text-[10px] sm:text-xs mb-3 sm:mb-4 ${plan.popular ? "text-jungle/60" : "text-beige/40"}`}>
                    Menos de {plan.monthly}
                  </p>
                  <div className="flex items-baseline gap-1 mb-6 sm:mb-8">
                    <span className="text-3xl sm:text-5xl font-black">${plan.price}</span>
                    <span className={`text-xs sm:text-sm ${plan.popular ? "text-jungle/50" : "text-beige/40"}`}>/mes</span>
                  </div>
                  <ul className="space-y-2.5 sm:space-y-3.5 mb-6 sm:mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                        <svg className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${plan.popular ? "text-jungle" : "text-oro"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className={f.includes("ILIMITADAS") ? "font-bold" : ""}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="https://wa.me/573176689580"
                    target="_blank"
                    className={`block text-center font-bold py-3 sm:py-4 rounded-full text-sm sm:text-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 ${
                      plan.popular
                        ? "bg-jungle-dark text-white sm:hover:bg-jungle shadow-lg"
                        : "bg-gradient-to-r from-oro to-oro-light text-jungle-dark shadow-lg shadow-oro/20"
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <div className="sm:hidden flex justify-center gap-1.5 mt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-oro" : "bg-beige/20"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIOS ============ */}
      <section id="testimonios" className="py-8 sm:py-14 bg-arena">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal direction="up">
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-oro font-semibold text-xs sm:text-sm tracking-wider uppercase">
                Casos reales
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-jungle mt-2 sm:mt-3 mb-3 sm:mb-5">
                Ellos ya confían en nosotros
              </h2>
            </div>
          </Reveal>

          <Stagger className="grid sm:grid-cols-3 gap-4 sm:gap-8" staggerDelay={0.15}>
            {[
              { quote: "Con LEGION, incluso a la distancia, estuve protegido. Me asesoran rápido y claro.", name: "Suboficial activo", context: "Proceso disciplinario", rating: 5 },
              { quote: "Gracias a LEGION, recuperé mi tranquilidad y mi honor. Ganamos el caso.", name: "Sargento retirado", context: "Defensa penal militar", rating: 5 },
              { quote: "Me suspendieron injustamente. Legion me ayudó a demostrar mi inocencia y me reintegraron.", name: "Patrullero activo", context: "Reintegro tras suspensión", rating: 5 },
            ].map((t, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm sm:hover:shadow-xl transition-all duration-500 sm:hover:-translate-y-1 h-full">
                  <div className="flex gap-0.5 sm:gap-1 mb-3 sm:mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <svg key={j} className="w-4 h-4 sm:w-5 sm:h-5 text-oro" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-4 sm:mb-6 italic text-sm sm:text-base">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 border-t border-gray-100 pt-3 sm:pt-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-jungle to-jungle-light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs sm:text-sm">{t.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-jungle text-xs sm:text-sm">{t.name}</div>
                      <div className="text-[10px] sm:text-xs text-gray-400">{t.context}</div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============ POLICIA NACIONAL SECTION ============ */}
      <Reveal direction="none" className="relative overflow-hidden">
        <div className="aspect-[16/10] sm:aspect-[21/8] max-h-[500px] relative">
          <Image
            src="/images/policia-nacional.webp"
            alt="Policía Nacional de Colombia"
            fill
            sizes="100vw"
            className="object-cover object-[center_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-jungle-dark/95 via-jungle-dark/75 to-jungle-dark/40 sm:to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full">
              <Reveal direction="left" delay={0.2}>
                <div className="max-w-sm sm:max-w-lg">
                  <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white mb-2 sm:mb-4">
                    Tu servicio merece respaldo
                  </h2>
                  <p className="text-beige/70 text-xs sm:text-lg leading-relaxed mb-4 sm:mb-8">
                    Cada dia arriesgas tu vida por Colombia. Lo mínimo que mereces
                    es tener un equipo legal a tu lado.
                  </p>
                  <a
                    href="https://wa.me/573176689580"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-base transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-lg"
                  >
                    Quiero mi escudo legal
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ============ CTA FINAL ============ */}
      <section className="py-8 sm:py-14 bg-jungle-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-jungle-dark via-jungle to-jungle-dark" />
        <div className="absolute top-0 right-0 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-oro/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 sm:w-[400px] h-60 sm:h-[400px] bg-oro/3 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
          <ScaleReveal>
            <Image
              src="/images/logo.svg"
              alt="Legión Jurídica"
              width={60}
              height={60}
              className="mx-auto mb-6 sm:mb-8 w-[50px] h-[50px] sm:w-[80px] sm:h-[80px] animate-float"
            />
          </ScaleReveal>
          <Reveal direction="up" delay={0.2}>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6">
              No esperes a que sea tarde
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.3}>
            <p className="text-sm sm:text-lg text-beige/60 mb-8 sm:mb-12 leading-relaxed max-w-xl mx-auto">
              Un problema legal no avisa. Pero si ya tienes tu escudo activo,
              solo tienes que escribirnos.
              <span className="text-oro font-semibold"> Nosotros nos encargamos.</span>
            </p>
          </Reveal>
          <Reveal direction="up" delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a
                href="https://wa.me/573176689580"
                target="_blank"
                className="group bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold px-7 py-3.5 sm:px-10 sm:py-5 rounded-full text-[15px] sm:text-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-2xl shadow-oro/30 flex items-center justify-center gap-2.5"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Escríbenos por WhatsApp
              </a>
              <a
                href="tel:+573176689580"
                className="border-2 border-white/20 active:border-oro/50 sm:hover:border-oro/50 text-white font-bold px-7 py-3.5 sm:px-10 sm:py-5 rounded-full text-[15px] sm:text-lg transition-all duration-300 flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Llámanos ahora
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
