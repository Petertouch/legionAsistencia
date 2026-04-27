"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Check, MessageCircle, Phone, Star, ArrowLeft, ArrowRight, FileText, Lock, Scale, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import ContractView from "@/components/contract/contract-view";
import type { ContractData } from "@/components/contract/contract-view";
import SignaturePad from "@/components/contract/signature-pad";
import PhotoCapture from "@/components/contract/photo-capture";
import { searchCiudades, type CiudadEntry } from "@/lib/colombia-geo";

const PLANES = [
  {
    name: "Base",
    price: "39.000",
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
    price: "51.000",
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
    price: "69.000",
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

// Valores por defecto si la plantilla de DB no carga. El valor real usado en
// el contrato es `precio_alianza` (lo que el suscriptor paga mensualmente
// bajo el acuerdo de alianza), con fallback a `precio` si no está definido.
const DEFAULT_PLAN_PRICES: Record<string, string> = { Base: "39.000", Plus: "51.000", "Élite": "69.000" };

// Normaliza nombres para emparejar "Élite" (con tilde) con "Elite" de la DB.
const normalizePlanName = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

interface PlantillaPlan {
  nombre: string;
  precio?: string;
  precio_alianza?: string;
}

const ESTADOS_CIVILES = ["Soltero(a)", "Casado(a)", "Unión libre", "Divorciado(a)", "Viudo(a)"];
const FUERZAS = ["Ejército", "Policía", "Armada", "Fuerza Aérea"];

interface Lanza {
  id: string;
  code: string;
  nombre: string;
}

interface Props {
  params: Promise<{ code: string }>;
}

async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ReferralPage({ params }: Props) {
  const { code } = use(params);
  const searchParams = useSearchParams();
  const resumeLeadId = searchParams.get("lead");
  const [lanza, setLanza] = useState<Lanza | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStepRaw] = useState(1); // 1=form, 2=contract+extras, 3=sign+photo, 4=password, 5=onboarding
  const [maxStep, setMaxStep] = useState(1); // step más alto al que ha llegado (para navegación en stepper)
  const [editingStep1, setEditingStep1] = useState(true); // si false, step 1 está en modo read-only
  const [editingStep2, setEditingStep2] = useState(true); // si false, step 2 está en modo read-only

  // Wrapper que actualiza step + maxStep. Si vuelve a un step ya completado,
  // pone los campos en modo read-only (bloqueados) hasta que pulse "Editar".
  const setStep = (s: number) => {
    setStepRaw(s);
    setMaxStep((prev) => Math.max(prev, s));
    if (s === 1 && maxStep >= 2) {
      setEditingStep1(false);
    } else if (s === 1) {
      setEditingStep1(true);
    }
    if (s === 2 && maxStep >= 3) {
      setEditingStep2(false);
    } else if (s === 2) {
      setEditingStep2(true);
    }
  };

  // Step 1: Basic form
  const [plan, setPlan] = useState("Base");
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    cedula: "",
  });

  // Step 2: Extra contract fields
  const [extra, setExtra] = useState({
    telefono2: "",
    estado_civil: "Soltero(a)",
    grado: "",
    fuerza: "Ejército",
    unidad: "",
    direccion: "",
    ciudad: "",
    departamento: "",
  });

  // Step 3: Signature + Photos (sub-steps: 1=firma, 2=selfie, 3=cedula frente, 4=cedula reverso)
  const [subStep, setSubStep] = useState(1);
  const [ciudadQuery, setCiudadQuery] = useState("");
  const [ciudadResults, setCiudadResults] = useState<CiudadEntry[]>([]);
  const [showCiudadDropdown, setShowCiudadDropdown] = useState(false);
  const [firmaData, setFirmaData] = useState("");
  const [fotoData, setFotoData] = useState("");
  const [cedulaFrenteData, setCedulaFrenteData] = useState("");
  const [cedulaReversoData, setCedulaReversoData] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Step 4: Password
  const [clave, setClave] = useState("");
  const [claveConfirm, setClaveConfirm] = useState("");
  const [contratoId, setContratoId] = useState<string | null>(null);

  // Confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);

  // Duplicate error modal — se muestra cuando ya hay suscriptor/contrato
  // o cuando el lead está en estado bloqueado (completado/descartado).
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Smart-resume modal — se muestra cuando detectamos que el cliente ya
  // tiene un proceso de registro a medio camino y le ofrecemos retomarlo.
  interface ResumePayload {
    id: string;
    current_step: number;
    nombre: string | null;
    cedula: string | null;
    telefono: string | null;
    email: string | null;
    plan_interes: string | null;
    last_activity_at: string | null;
  }
  const [resumeData, setResumeData] = useState<ResumePayload | null>(null);

  // Lead ID (saved after step 1)
  const [leadId, setLeadId] = useState<string | null>(null);

  // Flag para evitar que el auto-resume se re-ejecute al re-renderizar
  const [resumeApplied, setResumeApplied] = useState(false);

  // Precios cargados desde contrato_plantilla.planes. Preferimos precio_alianza
  // porque es el valor real que el suscriptor paga mensualmente bajo alianza.
  const [planPrices, setPlanPrices] = useState<Record<string, string>>(DEFAULT_PLAN_PRICES);

  const getPlanPrice = (planName: string): string => {
    const key = normalizePlanName(planName);
    // Busca coincidencia normalizada (maneja "Élite" vs "Elite").
    const match = Object.keys(planPrices).find((k) => normalizePlanName(k) === key);
    return match ? planPrices[match] : DEFAULT_PLAN_PRICES[planName] || "";
  };

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("lanzas")
      .select("id, code, nombre")
      .eq("code", code)
      .eq("status", "activo")
      .single()
      .then((res: { data: Lanza | null }) => {
        setLanza(res.data);
        setLoading(false);
      });

    // Carga los planes de la plantilla activa y construye el mapa de precios
    // usando precio_alianza (con fallback a precio).
    supabase
      .from("contrato_plantilla")
      .select("planes")
      .eq("activo", true)
      .single()
      .then(({ data }: { data: { planes: PlantillaPlan[] } | null }) => {
        if (data?.planes && Array.isArray(data.planes)) {
          const prices: Record<string, string> = {};
          for (const p of data.planes) {
            if (!p?.nombre) continue;
            const valor = (p.precio_alianza && p.precio_alianza.trim()) || p.precio || "";
            if (valor) prices[p.nombre] = valor;
          }
          if (Object.keys(prices).length > 0) setPlanPrices(prices);
        }
      });
  }, [code]);

  // Auto-resume: si la URL tiene ?lead=LEAD_ID (viene del panel del aliado),
  // cargamos los datos del lead desde la DB, pre-llenamos el form y saltamos
  // al step donde quedó sin que el usuario tenga que llenar nada otra vez.
  useEffect(() => {
    if (!resumeLeadId || resumeApplied) return;
    setResumeApplied(true);
    const supabase = createClient();
    supabase
      .from("lanza_leads")
      .select("id, nombre, cedula, telefono, email, plan_interes, current_step, datos_extra")
      .eq("id", resumeLeadId)
      .single()
      .then(({ data }: { data: { id: string; nombre: string; cedula: string; telefono: string; email: string; plan_interes: string | null; current_step: number | null; datos_extra: Record<string, string | null> | null } | null }) => {
        if (!data) return;
        const parts = (data.nombre || "").split(" ");
        setForm({
          nombre: parts[0] || "",
          apellido: parts.slice(1).join(" ") || "",
          cedula: data.cedula || "",
          telefono: data.telefono || "",
          email: data.email || "",
        });
        if (data.plan_interes) setPlan(data.plan_interes);

        // Pre-cargar datos extra del step 2 si existen
        if (data.datos_extra && typeof data.datos_extra === "object") {
          const d = data.datos_extra;
          setExtra((prev) => ({
            telefono2: d.telefono2 || prev.telefono2,
            estado_civil: d.estado_civil || prev.estado_civil,
            grado: d.grado || prev.grado,
            fuerza: d.fuerza || prev.fuerza,
            unidad: d.unidad || prev.unidad,
            direccion: d.direccion || prev.direccion,
            ciudad: d.ciudad || prev.ciudad,
            departamento: d.departamento || prev.departamento,
          }));
        }

        setLeadId(data.id);
        // Si quedó en step 3+ (ya había llenado el step 2), saltar a step 2
        // igual porque firma/fotos requieren recaptura en este dispositivo.
        // Si quedó en step 2 o menos, saltar a step 2.
        const targetStep = Math.min(data.current_step || 2, 3);
        setStep(targetStep);

        fetch("/api/lanza-leads/avanzar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: data.id, current_step: targetStep }),
        }).catch(() => {});
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeLeadId, resumeApplied]);

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const updateExtra = (field: string, value: string) =>
    setExtra((f) => ({ ...f, [field]: value }));

  // Step 1: Si es la primera vez, muestra modal de confirmación.
  // Si es edición (ya pasó el step 1 antes), guarda y vuelve al step 2 directo.
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (maxStep >= 2 && leadId) {
      // Modo edición: ya tiene lead creado, solo guardar y avanzar
      toast.success("Datos guardados");
      setEditingStep1(false);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setShowConfirm(true);
  };

  // Step 1 → 2: Save lead to Supabase (after user confirms)
  const confirmAndSaveLead = async () => {
    setShowConfirm(false);
    setSubmitting(true);

    // El insert va vía API server-side para validar unicidad global de
    // cédula, email y teléfono contra suscriptores, contratos y otros leads.
    // Si la persona tiene un lead a medio camino, el endpoint devuelve
    // { resume: true } y mostramos el modal de reanudar.
    try {
      const res = await fetch("/api/lanza-leads/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lanza_id: lanza?.id || null,
          lanza_code: code,
          nombre: `${form.nombre.trim()} ${form.apellido.trim()}`.trim(),
          telefono: form.telefono.trim(),
          email: form.email.trim(),
          cedula: form.cedula.trim(),
          plan_interes: plan,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 409/429 = conflicto de unicidad o rate limit con cédula. Modal con WhatsApp.
        if ((res.status === 409 || res.status === 429) && data?.error) {
          setDuplicateError(data.error);
        } else {
          toast.error(data?.error || "Error al guardar. Intenta de nuevo.");
        }
        setSubmitting(false);
        return;
      }

      // Smart-resume: hay lead en proceso del mismo cliente. Mostramos modal.
      if (data?.resume && data?.lead) {
        setResumeData(data.lead as ResumePayload);
        setSubmitting(false);
        return;
      }

      setLeadId(data?.id || null);
      setSubmitting(false);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error de red al guardar lead:", err);
      toast.error("Error de conexión. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  // Llamado cuando el usuario decide continuar su proceso anterior.
  // Pre-carga los datos del lead viejo y avanza al step donde quedó.
  const handleResumeContinue = () => {
    if (!resumeData) return;
    // Pre-cargar los datos del step 1 (editables)
    const rParts = (resumeData.nombre || "").split(" ");
    setForm({
      nombre: rParts[0] || "",
      apellido: rParts.slice(1).join(" ") || "",
      cedula: resumeData.cedula || "",
      telefono: resumeData.telefono || "",
      email: resumeData.email || "",
    });
    if (resumeData.plan_interes) setPlan(resumeData.plan_interes);
    setLeadId(resumeData.id);
    // No avanzamos más allá del step 2: los pasos 3 y 4 requieren capturar
    // firma/fotos/clave de nuevo en este dispositivo, no se pueden recuperar.
    const targetStep = Math.max(2, Math.min(2, resumeData.current_step || 2));
    setStep(targetStep);
    setResumeData(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Continuando tu registro...");
  };

  // Llamado cuando el usuario decide empezar de cero.
  // Mantiene el lead_id existente pero reinicia el flujo desde step 2.
  const handleResumeRestart = () => {
    if (!resumeData) return;
    const rParts = (resumeData.nombre || "").split(" ");
    setForm({
      nombre: rParts[0] || "",
      apellido: rParts.slice(1).join(" ") || "",
      cedula: resumeData.cedula || "",
      telefono: resumeData.telefono || "",
      email: resumeData.email || "",
    });
    if (resumeData.plan_interes) setPlan(resumeData.plan_interes);
    setLeadId(resumeData.id);
    setStep(2);
    setResumeData(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper que notifica al backend que el usuario avanzó a un nuevo step.
  // Falla silenciosa: no bloquea el flujo si la red falla.
  const trackStep = async (newStep: number, newStatus?: string) => {
    if (!leadId) return;
    try {
      await fetch("/api/lanza-leads/avanzar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, current_step: newStep, status: newStatus }),
      });
    } catch {
      // Silencioso — no debe interrumpir el onboarding del usuario
    }
  };

  // Step 2 → 3: Move to signing. Guarda los datos extra del step 2 en el
  // lead (JSONB) para poder reanudarlo si abandona aquí.
  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setSubStep(1);
    setStep(3);
    // trackStep con datos extra para persistir el formulario del step 2
    if (leadId) {
      fetch("/api/lanza-leads/avanzar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          current_step: 3,
          datos_extra: {
            telefono2: extra.telefono2 || null,
            estado_civil: extra.estado_civil || null,
            grado: extra.grado || null,
            fuerza: extra.fuerza || null,
            unidad: extra.unidad || null,
            direccion: extra.direccion || null,
            ciudad: extra.ciudad || null,
            departamento: extra.departamento || null,
          },
        }),
      }).catch(() => {});
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 3 → 4: Sign, capture, hash, save contract
  const handleSign = async () => {
    setSubmitting(true);

    const contractContent = JSON.stringify({
      ...form,
      ...extra,
      plan,
      plan_precio: getPlanPrice(plan),
      firma_timestamp: new Date().toISOString(),
    });
    const hash = await generateHash(contractContent + firmaData + fotoData + Date.now());

    // El insert va vía API server-side con service role porque la tabla
    // contratos tiene RLS que bloquea inserts desde anon. La API valida
    // que el lanza_code exista y esté activo antes de aceptar el contrato.
    try {
      const res = await fetch("/api/contratos/firmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          lanza_code: code,
          nombre: `${form.nombre.trim()} ${form.apellido.trim()}`.trim(),
          cedula: form.cedula.trim(),
          telefono: form.telefono.trim(),
          telefono2: extra.telefono2 || null,
          email: form.email.trim() || null,
          estado_civil: extra.estado_civil || null,
          grado: extra.grado || null,
          fuerza: extra.fuerza || null,
          unidad: extra.unidad || null,
          direccion: extra.direccion || null,
          ciudad: extra.ciudad || null,
          departamento: extra.departamento || null,
          plan,
          precio: getPlanPrice(plan),
          firma_data: firmaData,
          foto_data: fotoData,
          cedula_frente: cedulaFrenteData,
          cedula_reverso: cedulaReversoData,
          hash,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data?.error || `Error ${res.status}`;
        console.error("Error guardando contrato:", errorMsg);
        toast.error(`Error al guardar contrato: ${errorMsg}`);
        setSubmitting(false);
        return;
      }

      const { id: newContratoId } = await res.json();
      setContratoId(newContratoId || null);

      // Auto-register suscriptor with temp password (no step 4 needed)
      const fullName = `${form.nombre.trim()} ${form.apellido.trim()}`.trim();
      try {
        const regRes = await fetch("/api/client/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contrato_id: newContratoId,
            nombre: fullName,
            cedula: form.cedula.trim(),
            telefono: form.telefono.trim(),
            email: form.email.trim() || null,
            plan,
            fuerza: extra.fuerza || null,
            grado: extra.grado || null,
          }),
        });
        const regData = await regRes.json();

        // Send welcome email with temp password + PDF
        if (regRes.ok && form.email.trim()) {
          fetch("/api/mail/bienvenida", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contrato_id: newContratoId,
              nombre: fullName,
              email: form.email.trim(),
              plan,
              cedula: form.cedula.trim(),
              clave_temporal: regData.clave_temporal || "",
            }),
          }).catch(() => {}); // Fire and forget
        }
      } catch {
        // Suscriptor registration failed silently — admin can handle later
      }

      // Mark lead as completed
      if (leadId) {
        fetch("/api/lanza-leads/avanzar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: leadId,
            current_step: 5,
            status: "completado",
            contrato_id: newContratoId,
          }),
        }).catch(() => {});
      }

      setSubmitting(false);
      setStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("¡Contrato firmado! Revisa tu correo.");
    } catch (err) {
      console.error("Error de red al guardar contrato:", err);
      toast.error("Error de conexión. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  const contractData: ContractData = {
    nombre: `${form.nombre} ${form.apellido}`.trim(),
    cedula: form.cedula,
    telefono: form.telefono,
    telefono2: extra.telefono2,
    email: form.email,
    estado_civil: extra.estado_civil,
    grado: extra.grado,
    fuerza: extra.fuerza,
    unidad: extra.unidad,
    direccion: extra.direccion,
    ciudad: extra.ciudad,
    departamento: extra.departamento,
    plan,
    plan_precio: getPlanPrice(plan),
    firma_data: firmaData || undefined,
    foto_data: fotoData || undefined,
    cedula_frente: cedulaFrenteData || undefined,
    cedula_reverso: cedulaReversoData || undefined,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-oro/30 border-t-oro rounded-full animate-spin" />
      </div>
    );
  }

  // Máximo step al que el usuario ha llegado (para permitir navegar atrás).
  // No puede ir hacia adelante saltando pasos, pero sí volver a uno que ya completó.
  const maxStepReached = Math.max(step, ...(leadId ? [step] : [1]));

  const handleStepClick = (s: number) => {
    // Permite ir a cualquier step ya visitado (hacia atrás o adelante dentro de maxStep)
    if (s !== step && s <= maxStep) {
      setStep(s);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const STEP_LABELS = ["Datos", "Contrato", "Firma"] as const;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Progress bar — steps completados son clickeables */}
      {step < 5 && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <div className="flex items-start">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                {/* Círculo + label alineados verticalmente */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleStepClick(s)}
                    disabled={s > maxStep || s === step}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                      s <= maxStep
                        ? "bg-oro text-jungle-dark"
                        : "bg-gray-100 text-gray-400"
                    } ${s <= maxStep && s !== step ? "cursor-pointer hover:scale-110 hover:ring-2 hover:ring-oro/50" : s === step ? "ring-2 ring-oro/30" : "cursor-default"}`}
                    title={s <= maxStep && s !== step ? `Ir a ${STEP_LABELS[s - 1]}` : undefined}
                  >
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepClick(s)}
                    disabled={s > maxStep || s === step}
                    className={`text-[10px] mt-1 transition-colors ${
                      s <= maxStep && s !== step
                        ? "text-oro/60 hover:text-oro cursor-pointer"
                        : s === step
                          ? "text-oro font-semibold"
                          : "text-gray-400 cursor-default"
                    }`}
                  >
                    {STEP_LABELS[s - 1]}
                  </button>
                </div>
                {/* Línea conectora (no después del último) */}
                {s < 4 && (
                  <div className={`flex-1 h-0.5 rounded-full mt-[-12px] mx-1 ${s < maxStep ? "bg-oro" : "bg-gray-100"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Lanza banner */}
        {lanza && step === 1 && (
          <div className="bg-oro/10 border border-oro/20 rounded-xl p-4 text-center">
            <p className="text-oro text-sm font-medium">
              <strong>{lanza.nombre}</strong> te invitó a Legión Jurídica
            </p>
          </div>
        )}

        {/* ═══════ STEP 1: FORM + PLANS ═══════ */}

        {/* Step 1 read-only: resumen cuando vuelve desde un step posterior */}
        {step === 1 && !editingStep1 && (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-gray-900 text-xl font-bold">Tus datos</h1>
              <p className="text-gray-500 text-sm">Revisa tus datos. Puedes editarlos si necesitas corregir algo.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Nombre", form.nombre || "—"],
                  ["Teléfono", form.telefono || "—"],
                  ["Cédula", form.cedula || "—"],
                  ["Email", form.email || "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="text-gray-500 text-xs">{label}</span>
                    <p className="text-gray-900 text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-gray-500 text-xs">Plan seleccionado</span>
                <span className="text-oro font-bold text-sm">{plan} — ${getPlanPrice(plan)}/mes</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStep1(true)}
                  className="flex items-center gap-1.5 text-oro hover:text-oro-light text-sm px-4 py-2.5 rounded-xl border border-oro/30 hover:bg-oro/10 transition-colors font-medium"
                >
                  <Scale className="w-4 h-4" /> Editar datos
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Continuar al contrato <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 1 editable: form completo (primera vez o después de pulsar Editar) */}
        {step === 1 && editingStep1 && (
          <>
            {/* Hero */}
            <div className="text-center space-y-3">
              <h1 className="text-gray-900 text-2xl md:text-3xl font-bold leading-tight">
                Tu abogado en el bolsillo,<br />
                <span className="text-oro">24/7</span>
              </h1>
              <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto">
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
                <div key={b.text} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                  <span className="text-xl">{b.icon}</span>
                  <p className="text-gray-700 text-xs mt-1">{b.text}</p>
                </div>
              ))}
            </div>

            {/* Plans */}
            <div>
              <h2 className="text-gray-900 text-lg font-bold text-center mb-1">Elige tu plan</h2>
              <p className="text-gray-500 text-xs text-center mb-4">Toca el plan que prefieras</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PLANES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setPlan(p.name)}
                    className={`relative text-left rounded-xl border p-4 transition-all ${
                      plan === p.name
                        ? "border-oro bg-oro/10 ring-2 ring-oro/40 scale-[1.02]"
                        : p.color + " hover:border-gray-200 opacity-60 hover:opacity-80"
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2.5 right-3 bg-blue-500 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> Popular
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.badge}`}>
                        {p.name}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        plan === p.name ? "border-oro bg-oro" : "border-gray-200"
                      }`}>
                        {plan === p.name && <Check className="w-3 h-3 text-jungle-dark" />}
                      </div>
                    </div>
                    <p className="text-gray-900 text-xl font-bold">
                      ${getPlanPrice(p.name)}<span className="text-gray-500 text-xs font-normal">/mes</span>
                    </p>
                    <ul className="mt-2.5 space-y-1.5">
                      {p.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-1.5 text-gray-600 text-xs">
                          <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    {plan === p.name && (
                      <div className="mt-3 bg-oro/20 text-oro text-xs font-bold text-center py-1.5 rounded-lg">
                        Seleccionado
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Registration form */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-gray-900 font-bold text-base mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-oro" /> Regístrate ahora
              </h3>
              <form onSubmit={handleStep1} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Nombre *</label>
                    <input
                      type="text" required value={form.nombre}
                      onChange={(e) => update("nombre", e.target.value)}
                      placeholder="José"
                      className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Apellido *</label>
                    <input
                      type="text" required value={form.apellido}
                      onChange={(e) => update("apellido", e.target.value)}
                      placeholder="Pérez"
                      className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Teléfono *</label>
                    <input
                      type="tel" required value={form.telefono}
                      onChange={(e) => update("telefono", e.target.value.replace(/\D/g, ""))}
                      placeholder="3176689580" inputMode="numeric"
                      className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Cédula *</label>
                    <input
                      type="text" required value={form.cedula}
                      onChange={(e) => update("cedula", e.target.value.replace(/\D/g, ""))}
                      placeholder="12345678" inputMode="numeric"
                      className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-600 text-xs font-medium mb-1 block">Email</label>
                  <input
                    type="email" value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                  />
                </div>
                <div className="bg-white rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Plan seleccionado</span>
                  <span className="text-oro font-bold text-sm">{plan} — ${getPlanPrice(plan)}/mes</span>
                </div>
                {lanza && (
                  <div className="bg-oro/5 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-gray-500 text-xs">Referido por</span>
                    <span className="text-oro text-xs font-medium">{lanza.nombre}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {maxStep >= 2 ? (
                    <><Check className="w-5 h-5" /> {submitting ? "Guardando..." : "Guardar cambios"}</>
                  ) : (
                    <><FileText className="w-5 h-5" /> {submitting ? "Guardando..." : "Continuar al contrato"}</>
                  )}
                </button>
                {maxStep < 2 && (
                  <p className="text-gray-400 text-[10px] text-center">
                    En el siguiente paso verás y firmarás el contrato de prestación de servicios
                  </p>
                )}
              </form>
            </div>
          </>
        )}

        {/* ═══════ STEP 2: EXTRA DATA + CONTRACT PREVIEW ═══════ */}
        {step === 2 && (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-gray-900 text-xl font-bold">
                {editingStep2 ? "Completa tus datos para el contrato" : "Datos del contrato"}
              </h1>
              <p className="text-gray-500 text-sm">
                {editingStep2
                  ? "Necesitamos algunos datos adicionales para generar tu contrato"
                  : "Revisa tus datos. Puedes editarlos si necesitas corregir algo."}
              </p>
            </div>

            {/* Modo read-only: resumen de datos con botón Editar */}
            {!editingStep2 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Teléfono 2", extra.telefono2 || "—"],
                    ["Estado civil", extra.estado_civil],
                    ["Grado / Rango", extra.grado || "—"],
                    ["Fuerza", extra.fuerza],
                    ["Unidad / Batallón", extra.unidad || "—"],
                    ["Dirección", extra.direccion || "—"],
                    ["Ciudad", extra.ciudad || "—"],
                    ["Departamento", extra.departamento || "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span className="text-gray-500 text-xs">{label}</span>
                      <p className="text-gray-900 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingStep2(true)}
                    className="flex items-center gap-1.5 text-oro hover:text-oro-light text-sm px-4 py-2.5 rounded-xl border border-oro/30 hover:bg-oro/10 transition-colors font-medium"
                  >
                    <Scale className="w-4 h-4" /> Editar datos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Ver contrato y firmar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Modo editable: form normal */
              <form onSubmit={handleStep2} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Teléfono 2</label>
                    <input
                      type="tel" value={extra.telefono2}
                      onChange={(e) => updateExtra("telefono2", e.target.value.replace(/\D/g, ""))}
                      placeholder="Opcional" inputMode="numeric"
                      className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Estado civil *</label>
                    <select
                      value={extra.estado_civil} required
                      onChange={(e) => updateExtra("estado_civil", e.target.value)}
                      className="w-full bg-white text-gray-700 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none appearance-none cursor-pointer"
                    >
                      {ESTADOS_CIVILES.map((ec) => <option key={ec} value={ec}>{ec}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Grado / Rango *</label>
                    <input
                      type="text" required value={extra.grado}
                      onChange={(e) => updateExtra("grado", e.target.value)}
                      placeholder="Sargento, Cabo, etc."
                      className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Fuerza *</label>
                    <select
                      value={extra.fuerza} required
                      onChange={(e) => updateExtra("fuerza", e.target.value)}
                      className="w-full bg-white text-gray-700 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none appearance-none cursor-pointer"
                    >
                      {FUERZAS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-gray-600 text-xs font-medium mb-1 block">Unidad / Batallón *</label>
                  <input
                    type="text" required value={extra.unidad}
                    onChange={(e) => updateExtra("unidad", e.target.value)}
                    placeholder="Batallón de Infantería No. 1"
                    className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-xs font-medium mb-1 block">Dirección *</label>
                  <input
                    type="text" required value={extra.direccion}
                    onChange={(e) => updateExtra("direccion", e.target.value)}
                    placeholder="Calle 123 #45-67"
                    className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative col-span-2 sm:col-span-1">
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Ciudad *</label>
                    <input
                      type="text" required
                      value={ciudadQuery || extra.ciudad}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCiudadQuery(val);
                        if (val !== extra.ciudad) {
                          updateExtra("ciudad", "");
                          updateExtra("departamento", "");
                        }
                        setCiudadResults(searchCiudades(val));
                        setShowCiudadDropdown(true);
                      }}
                      onFocus={() => { if (ciudadQuery.length >= 2) setShowCiudadDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowCiudadDropdown(false), 200)}
                      placeholder="Escribe tu ciudad..."
                      autoComplete="off"
                      className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                    />
                    {showCiudadDropdown && ciudadResults.length > 0 && (
                      <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {ciudadResults.map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              updateExtra("ciudad", c.ciudad);
                              updateExtra("departamento", c.departamento);
                              setCiudadQuery(c.ciudad);
                              setShowCiudadDropdown(false);
                              setCiudadResults([]);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-amber-50 transition-colors text-sm"
                          >
                            <span className="text-gray-900 font-medium">{c.ciudad}</span>
                            <span className="text-gray-400 text-xs ml-2">{c.departamento}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Departamento</label>
                    <input
                      type="text" readOnly value={extra.departamento}
                      placeholder="Se llena automáticamente"
                      className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 rounded-lg border border-gray-200 cursor-default"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Ver contrato y firmar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Contract preview */}
            <div>
              <h2 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-oro" /> Vista previa del contrato
              </h2>
              <ContractView data={contractData} />
            </div>
          </>
        )}

        {/* ═══════ STEP 3: FIRMA + SELFIE + CÉDULA (sub-steps) ═══════ */}
        {step === 3 && (
          <>
            {/* Sub-step progress */}
            <div className="flex items-center gap-1.5 justify-center">
              {["Firma", "Selfie", "Cédula frente", "Cédula reverso"].map((label, i) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full transition-colors ${subStep > i + 1 ? "bg-green-400" : subStep === i + 1 ? "bg-oro" : "bg-gray-100"}`} />
                  <span className={`text-[10px] transition-colors ${subStep === i + 1 ? "text-oro font-medium" : "text-gray-400"}`}>{label}</span>
                  {i < 3 && <div className={`w-3 h-px ${subStep > i + 1 ? "bg-green-400/50" : "bg-gray-100"}`} />}
                </div>
              ))}
            </div>

            {/* ── Sub-step 1: Firma ── */}
            {subStep === 1 && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <h1 className="text-gray-900 text-xl font-bold">Firma tu contrato</h1>
                  <p className="text-gray-500 text-sm">Firma con tu dedo o mouse sobre el recuadro</p>
                </div>

                <details className="bg-white border border-gray-200 rounded-xl">
                  <summary className="px-5 py-3 text-gray-900 text-sm font-medium cursor-pointer flex items-center gap-2">
                    <FileText className="w-4 h-4 text-oro" /> Ver contrato completo
                  </summary>
                  <div className="px-5 pb-5">
                    <ContractView data={contractData} />
                  </div>
                </details>

                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <SignaturePad onSignature={setFirmaData} />
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setStep(2)}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-white transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Atrás
                    </button>
                    <button type="button" disabled={!firmaData}
                      onClick={() => { setSubStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="flex-1 bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40">
                      Siguiente <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Sub-step 2: Selfie ── */}
            {subStep === 2 && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <h1 className="text-gray-900 text-xl font-bold">Tómate una selfie</h1>
                  <p className="text-gray-500 text-sm">Centra tu rostro dentro del círculo</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <PhotoCapture onPhoto={setFotoData} label="Abrir cámara" guide="circle" facingMode="user" />
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setSubStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-white transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Atrás
                    </button>
                    <button type="button" disabled={!fotoData}
                      onClick={() => { setSubStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="flex-1 bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40">
                      Siguiente <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Sub-step 3: Cédula frente ── */}
            {subStep === 3 && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <h1 className="text-gray-900 text-xl font-bold">Foto de tu cédula</h1>
                  <p className="text-gray-500 text-sm">Parte frontal — encuadra la cédula dentro del marco</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <PhotoCapture onPhoto={setCedulaFrenteData} label="Abrir cámara" guide="card" facingMode="environment" />
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setSubStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-white transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Atrás
                    </button>
                    <button type="button" disabled={!cedulaFrenteData}
                      onClick={() => { setSubStep(4); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="flex-1 bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40">
                      Siguiente <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Sub-step 4: Cédula reverso ── */}
            {subStep === 4 && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <h1 className="text-gray-900 text-xl font-bold">Foto de tu cédula</h1>
                  <p className="text-gray-500 text-sm">Parte trasera — voltea la cédula y encuádrala</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <PhotoCapture onPhoto={setCedulaReversoData} label="Abrir cámara" guide="card" facingMode="environment" />
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setSubStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-white transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Atrás
                    </button>
                    <button type="button" disabled={submitting || !cedulaReversoData}
                      onClick={handleSign}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Check className="w-5 h-5" /> {submitting ? "Firmando..." : "Firmar contrato"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════ STEP 5: ONBOARDING ═══════ */}
        {step === 5 && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-oro/20 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-oro" />
              </div>
              <h1 className="text-gray-900 text-xl font-bold">¡Bienvenido a Legión Jurídica!</h1>
              <p className="text-gray-600 text-sm">Tu cuenta está lista. Así funciona tu portal:</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  icon: <Scale className="w-5 h-5 text-oro" />,
                  title: "Mis Casos",
                  desc: "Aquí verás el estado de tus procesos legales. Tu abogado actualizará cada etapa y podrás seguir el avance en tiempo real.",
                },
                {
                  icon: <MessageCircle className="w-5 h-5 text-green-400" />,
                  title: "Solicitar asesoría",
                  desc: "Desde tu portal puedes enviar consultas directamente a tu abogado asignado. También puedes escribirnos por WhatsApp.",
                },
                {
                  icon: <HelpCircle className="w-5 h-5 text-blue-400" />,
                  title: "¿Cómo pedir algo?",
                  desc: "Te enviamos un correo con tu clave temporal. Entra a tu portal con tu cédula y esa clave. La primera vez te pediremos cambiarla.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-sm">{item.title}</h3>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-oro/10 border border-oro/20 rounded-xl p-4 text-center space-y-2">
              <p className="text-oro text-sm font-medium">Tu acceso al portal</p>
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="text-gray-500">Usuario: <strong className="text-gray-900">{form.cedula}</strong></span>
                <span className="text-gray-500">Clave: <strong className="text-gray-900">revisa tu correo</strong></span>
              </div>
              <p className="text-gray-400 text-[10px]">Te enviamos tu clave temporal a {form.email || "tu correo"}</p>
              <a
                href="/mi-caso"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-oro to-oro-light text-jungle-dark px-5 py-2.5 rounded-xl font-bold text-sm mt-2 transition-all active:scale-[0.98]"
              >
                <Lock className="w-4 h-4" /> Ir al portal
              </a>
            </div>

            <a
              href={`https://wa.me/573176689580?text=${encodeURIComponent(
                `Hola, acabo de firmar mi contrato del Plan ${plan}. Mi nombre es ${form.nombre} ${form.apellido}, cédula ${form.cedula}. Código: ${code}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors text-sm"
            >
              <MessageCircle className="w-5 h-5" /> Contactar por WhatsApp
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-2 pb-6">
          <div className="flex items-center justify-center gap-4 text-gray-500 text-xs">
            <a href="tel:+573176689580" className="flex items-center gap-1 hover:text-oro transition-colors">
              <Phone className="w-3 h-3" /> 317 668 9580
            </a>
            <span>•</span>
            <span>Bogotá, Colombia</span>
          </div>
          <p className="text-gray-300 text-[10px]">
            Legión Jurídica © {new Date().getFullYear()} — Servicio legal para la fuerza pública
          </p>
        </div>
      </main>

      {/* ═══ Confirmation Modal ═══ */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-gray-900 font-bold text-lg">Confirma tus datos</h3>
              <p className="text-gray-500 text-xs mt-1">Revisa que todo esté correcto antes de continuar</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs">Nombre</span>
                <span className="text-gray-900 text-sm font-medium">{form.nombre}</span>
              </div>
              <div className="border-t border-gray-100" />
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs">Teléfono</span>
                <span className="text-gray-900 text-sm font-medium">{form.telefono}</span>
              </div>
              <div className="border-t border-gray-100" />
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs">Cédula</span>
                <span className="text-gray-900 text-sm font-medium">{form.cedula}</span>
              </div>
              {form.email && (
                <>
                  <div className="border-t border-gray-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">Email</span>
                    <span className="text-gray-900 text-sm font-medium">{form.email}</span>
                  </div>
                </>
              )}
              <div className="border-t border-gray-100" />
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs">Plan</span>
                <span className="text-oro text-sm font-bold">{plan} — ${getPlanPrice(plan)}/mes</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 text-gray-600 hover:text-gray-900 text-sm py-3 rounded-xl border border-gray-200 hover:bg-white transition-colors font-medium"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={confirmAndSaveLead}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> {submitting ? "Guardando..." : "Datos correctos"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Smart-Resume Modal ═══ */}
      {resumeData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setResumeData(null)}
        >
          <div
            className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto bg-blue-500/15 rounded-full flex items-center justify-center">
                <ArrowRight className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-gray-900 font-bold text-lg">¿Continuar tu registro?</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Detectamos que ya iniciaste tu proceso. Puedes continuar donde quedaste o empezar de nuevo con los mismos datos.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Nombre</span>
                <span className="text-gray-900 font-medium">{resumeData.nombre || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cédula</span>
                <span className="text-gray-900 font-medium">{resumeData.cedula || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quedaste en</span>
                <span className="text-oro font-bold">Paso {resumeData.current_step} de 4</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleResumeContinue}
                className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" /> Continuar mi proceso
              </button>
              <button
                type="button"
                onClick={handleResumeRestart}
                className="w-full text-gray-600 hover:text-gray-900 text-sm py-2.5 rounded-xl border border-gray-200 hover:bg-white transition-colors font-medium"
              >
                Empezar de nuevo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Duplicate Error Modal ═══ */}
      {duplicateError && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDuplicateError(null)}
        >
          <div
            className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto bg-amber-500/15 rounded-full flex items-center justify-center">
                <Shield className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-gray-900 font-bold text-lg">Datos ya registrados</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{duplicateError}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href="https://wa.me/573176689580?text=Hola%2C%20intent%C3%A9%20registrarme%20en%20Legi%C3%B3n%20Jur%C3%ADdica%20pero%20mis%20datos%20ya%20est%C3%A1n%20registrados.%20Necesito%20ayuda."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-gray-900 text-center font-bold py-3 rounded-xl text-sm hover:bg-[#20BD5A] transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setDuplicateError(null)}
                className="w-full text-gray-600 hover:text-gray-900 text-sm py-2.5 rounded-xl border border-gray-200 hover:bg-white transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}