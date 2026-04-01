"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Scale, GraduationCap, Award, Gift, FileText, ArrowRight, X, Sparkles } from "lucide-react";

const TOUR_STEPS = [
  {
    tabIndex: 0,
    icon: User,
    title: "Tu panel principal",
    description: "Aquí ves el resumen de tus casos, accesos rápidos a cursos y referidos. Es tu punto de partida.",
    color: "text-oro",
  },
  {
    tabIndex: 1,
    icon: Scale,
    title: "Mis Casos",
    description: "Revisa el estado y avance de todos tus casos legales. Cada caso muestra su etapa actual y abogado asignado.",
    color: "text-blue-400",
  },
  {
    tabIndex: 2,
    icon: GraduationCap,
    title: "Cursos",
    description: "Explora cursos gratuitos de finanzas y formación legal diseñados específicamente para militares y policías.",
    color: "text-purple-400",
  },
  {
    tabIndex: 3,
    icon: Award,
    title: "Diplomas",
    description: "Cuando completes un curso, tu diploma se emitirá automáticamente y podrás descargarlo aquí.",
    color: "text-oro",
  },
  {
    tabIndex: 4,
    icon: Gift,
    title: "Referidos",
    description: "Invita compañeros de tu unidad. Por cada referido que se inscriba, ganas una comisión.",
    color: "text-green-400",
  },
  {
    tabIndex: 5,
    icon: FileText,
    title: "Contrato",
    description: "Consulta tu contrato, plan activo y documentos en cualquier momento.",
    color: "text-beige/70",
  },
];

const LS_KEY = "legion-tour-done";

export default function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [tabPositions, setTabPositions] = useState<DOMRect[]>([]);

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) return;
    // Small delay to let the page render
    const timer = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const measureTabs = useCallback(() => {
    const nav = document.querySelector("nav");
    if (!nav) return;
    const links = nav.querySelectorAll("a");
    const rects: DOMRect[] = [];
    links.forEach((link) => rects.push(link.getBoundingClientRect()));
    setTabPositions(rects);
  }, []);

  useEffect(() => {
    if (show) {
      measureTabs();
      window.addEventListener("resize", measureTabs);
      return () => window.removeEventListener("resize", measureTabs);
    }
  }, [show, measureTabs]);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setShow(false);
    localStorage.setItem(LS_KEY, "1");
  };

  if (!show || tabPositions.length === 0) return null;

  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const tabRect = tabPositions[current.tabIndex];

  if (!tabRect) return null;

  // Calculate tooltip position
  const tooltipLeft = Math.max(16, Math.min(tabRect.left + tabRect.width / 2 - 150, window.innerWidth - 316));
  const arrowLeft = tabRect.left + tabRect.width / 2 - tooltipLeft;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[60]" onClick={handleClose}>
        {/* Dark overlay with cutout for the active tab */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Highlight on active tab */}
      <div
        className="fixed z-[61] rounded-lg transition-all duration-300 ease-out"
        style={{
          left: tabRect.left - 4,
          top: tabRect.top - 4,
          width: tabRect.width + 8,
          height: tabRect.height + 8,
          boxShadow: "0 0 0 3000px rgba(0,0,0,0.6)",
          background: "transparent",
          pointerEvents: "none",
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[62] w-[300px] transition-all duration-300 ease-out"
        style={{ left: tooltipLeft, top: tabRect.bottom + 12 }}
      >
        {/* Arrow */}
        <div
          className="absolute -top-2 w-4 h-4 bg-white rotate-45 rounded-sm"
          style={{ left: Math.max(16, Math.min(arrowLeft - 8, 276)) }}
        />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden relative">
          {/* Step indicator */}
          <div className="flex gap-1 px-5 pt-4">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full flex-1 transition-colors ${i <= step ? "bg-oro" : "bg-gray-200"}`} />
            ))}
          </div>

          <div className="p-5 pt-4">
            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-jungle-dark/5 flex items-center justify-center ${current.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-900 font-bold text-sm">{current.title}</p>
                <p className="text-gray-400 text-[10px]">Paso {step + 1} de {TOUR_STEPS.length}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{current.description}</p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button onClick={handleClose} className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
                Omitir tour
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-jungle-dark text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-jungle transition-colors active:scale-95"
              >
                {step < TOUR_STEPS.length - 1 ? (
                  <>Siguiente <ArrowRight className="w-3.5 h-3.5" /></>
                ) : (
                  <>¡Listo! <Sparkles className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
