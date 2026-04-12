"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClientStore } from "@/lib/stores/client-store";
import { MOCK_CASOS } from "@/lib/mock-data";
import { PIPELINES } from "@/lib/pipelines";
import {
  User, Shield, Scale, ArrowRight, Clock, Check, AlertTriangle,
  FileText, GraduationCap, Gift, Phone, Mail, ChevronRight, MessageCircle,
  Users, Lock, Plus,
} from "lucide-react";
import { toast } from "sonner";

interface Beneficiario {
  id: string;
  nombre: string;
  parentesco: string;
  cedula: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  created_at: string;
}

const PARENTESCOS = ["Cónyuge", "Hijo(a)", "Padre", "Madre", "Hermano(a)"];
import dynamic from "next/dynamic";

const ClientContratoPage = dynamic(() => import("@/app/(client)/mi-caso/contrato/page"), { ssr: false });

const PAGO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Check }> = {
  "Al dia": { label: "Al día", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: Check },
  "Pendiente": { label: "Pendiente", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: Clock },
  "Vencido": { label: "Vencido", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: AlertTriangle },
};

export default function ClientDashboardPage() {
  const router = useRouter();
  const session = useClientStore((s) => s.session);
  const [mounted, setMounted] = useState(false);
  const [subTab, setSubTab] = useState<"resumen" | "contrato">("resumen");

  // Familia
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [showFamiliaForm, setShowFamiliaForm] = useState(false);
  const [familiaLoading, setFamiliaLoading] = useState(false);
  const [familiaForm, setFamiliaForm] = useState({
    nombre: "", parentesco: "Cónyuge", cedula: "", email: "", telefono: "",
  });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !session) router.replace("/mi-caso"); }, [mounted, session, router]);

  // Cargar beneficiarios
  useEffect(() => {
    if (!session) return;
    fetch(`/api/client/beneficiarios?suscriptor_id=${session.suscriptor_id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setBeneficiarios(data as Beneficiario[]));
  }, [session]);

  if (!mounted || !session) return null;

  const handleAddFamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFamiliaLoading(true);
    try {
      const res = await fetch("/api/client/beneficiarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suscriptor_id: session.suscriptor_id, ...familiaForm }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al agregar"); setFamiliaLoading(false); return; }
      setBeneficiarios((prev) => [...prev, data as Beneficiario]);
      setFamiliaForm({ nombre: "", parentesco: "Cónyuge", cedula: "", email: "", telefono: "" });
      setShowFamiliaForm(false);
      toast.success(session.estado_pago === "Al dia"
        ? "Familiar agregado y activado"
        : "Familiar pre-registrado. Se activará cuando tu cuenta sea aprobada.");
    } catch { toast.error("Error de conexión"); }
    setFamiliaLoading(false);
  };

  const handleRemoveFamiliar = async (id: string) => {
    try {
      const res = await fetch(`/api/client/beneficiarios?id=${id}&suscriptor_id=${session.suscriptor_id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("No se pudo eliminar"); return; }
      setBeneficiarios((prev) => prev.filter((b) => b.id !== id));
      toast.success("Familiar eliminado");
    } catch { toast.error("Error de conexión"); }
  };

  const casos = MOCK_CASOS.filter((c) => c.suscriptor_id === session.suscriptor_id);
  const casosActivos = casos.filter((c) => c.etapa !== "Cerrado");
  const casosCerrados = casos.filter((c) => c.etapa === "Cerrado");
  const pago = PAGO_CONFIG[session.estado_pago] || PAGO_CONFIG["Al dia"];
  const PagoIcon = pago.icon;

  return (
    <div className="space-y-4">
      {/* Sub-tabs: Resumen | Contrato */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { key: "resumen" as const, label: "Resumen", icon: User },
          { key: "contrato" as const, label: "Contrato", icon: FileText },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              subTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Contrato sub-tab */}
      {subTab === "contrato" && <ClientContratoPage />}

      {/* Resumen sub-tab */}
      {subTab !== "contrato" && (<>

      {/* Pending approval */}
      {session.estado_pago === "Pendiente" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center">
          <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <h2 className="text-yellow-800 font-bold text-sm">Cuenta pendiente de aprobación</h2>
          <p className="text-yellow-600 text-xs mt-1">Tu contrato fue recibido. Te notificaremos cuando sea aprobado.</p>
        </div>
      )}

      {/* Welcome + Status */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-jungle-dark p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-oro" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-lg truncate">Hola, {session.nombre.split(" ")[0]}</h1>
              <p className="text-beige/50 text-xs">{session.rango} · {session.rama}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="p-4 text-center">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Plan</p>
            <p className="text-gray-900 font-bold text-sm">{session.plan}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Estado</p>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${pago.bg} ${pago.color}`}>
              <PagoIcon className="w-3 h-3" /> {pago.label}
            </span>
          </div>
        </div>
      </div>

      {/* Casos activos — compacto */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-jungle-dark/50" /> Mis Casos
            {casosActivos.length > 0 && <span className="text-[10px] text-gray-400 font-normal">{casosActivos.length} activos · {casosCerrados.length} cerrados</span>}
          </h2>
          {casos.length > 0 && (
            <Link href="/mi-caso/casos" className="text-jungle-dark text-xs font-medium flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {casosActivos.length === 0 ? (
          <div className="p-5 text-center">
            <p className="text-gray-400 text-sm">No tienes casos activos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {casosActivos.slice(0, 3).map((caso) => {
              const pipeline = PIPELINES[caso.area];
              const progress = Math.round(((caso.etapa_index + 1) / pipeline.stages.length) * 100);
              return (
                <Link key={caso.id} href={`/mi-caso/casos/${caso.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-900 text-sm font-medium truncate">{caso.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">{caso.area}</span>
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                        <div className="h-full bg-oro rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400">{caso.etapa}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick access grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/mi-caso/cursos"
          className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-jungle-dark/20 transition-colors active:scale-[0.98]">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-gray-900 font-semibold text-sm">Cursos</p>
          <p className="text-gray-400 text-xs mt-0.5">Formación legal</p>
        </Link>

        <Link href="/mi-caso/referidos"
          className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-jungle-dark/20 transition-colors active:scale-[0.98]">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
            <Gift className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-gray-900 font-semibold text-sm">Referidos</p>
          <p className="text-gray-400 text-xs mt-0.5">Gana comisiones</p>
        </Link>
      </div>

      {/* Familia */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-jungle-dark/50" /> Mi Familia
            {beneficiarios.length > 0 && (
              <span className="text-[10px] text-gray-400 font-normal">{beneficiarios.length} registrados</span>
            )}
          </h2>
          {!showFamiliaForm && (
            <button
              className="text-jungle-dark text-xs font-medium flex items-center gap-1 hover:underline"
              onClick={() => setShowFamiliaForm(true)}
            >
              <Plus className="w-3 h-3" /> Agregar
            </button>
          )}
        </div>

        {/* Aviso de pre-aprobación */}
        {session.estado_pago === "Pendiente" && beneficiarios.length === 0 && !showFamiliaForm && (
          <div className="p-5 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Disponible cuando tu cuenta sea aprobada</p>
            <p className="text-gray-400 text-xs mt-1">
              Una vez aprobado tu contrato, podrás agregar a tu cónyuge, hijos y padres dependientes para que también reciban cobertura legal.
            </p>
            <button
              onClick={() => setShowFamiliaForm(true)}
              className="mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 mx-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Pre-registrar familiar
            </button>
          </div>
        )}

        {/* Estado vacío cuando aprobado */}
        {session.estado_pago !== "Pendiente" && beneficiarios.length === 0 && !showFamiliaForm && (
          <div className="p-5 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-gray-500 text-sm">Aún no tienes familiares registrados</p>
            <p className="text-gray-400 text-xs mt-1">
              Agrega a tu cónyuge, hijos o padres dependientes. Tu plan incluye cobertura familiar.
            </p>
            <button
              onClick={() => setShowFamiliaForm(true)}
              className="mt-3 bg-jungle-dark text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-jungle transition-colors flex items-center gap-1.5 mx-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar familiar
            </button>
          </div>
        )}

        {/* Lista de beneficiarios */}
        {beneficiarios.length > 0 && !showFamiliaForm && (
          <div className="divide-y divide-gray-50">
            {beneficiarios.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 text-sm font-medium truncate">{b.nombre}</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
                      {b.parentesco}
                    </span>
                    {b.activo ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                        Activo
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                    <span>CC {b.cedula}</span>
                    {b.telefono && <span>· {b.telefono}</span>}
                    {b.email && <span>· {b.email}</span>}
                  </div>
                </div>
                {/* Eliminar solo disponible para admin — el cliente no puede quitar familiares */}
              </div>
            ))}
          </div>
        )}

        {/* Formulario de agregar familiar */}
        {showFamiliaForm && (
          <form onSubmit={handleAddFamiliar} className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-gray-600 text-xs font-medium mb-1 block">Nombre completo *</label>
                <input
                  type="text" required value={familiaForm.nombre}
                  onChange={(e) => setFamiliaForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre y apellido"
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-medium mb-1 block">Parentesco *</label>
                <select
                  value={familiaForm.parentesco} required
                  onChange={(e) => setFamiliaForm((f) => ({ ...f, parentesco: e.target.value }))}
                  className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
                >
                  {PARENTESCOS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-600 text-xs font-medium mb-1 block">Cédula *</label>
                <input
                  type="text" required value={familiaForm.cedula} inputMode="numeric"
                  onChange={(e) => setFamiliaForm((f) => ({ ...f, cedula: e.target.value.replace(/\D/g, "") }))}
                  placeholder="12345678"
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-medium mb-1 block">Email</label>
                <input
                  type="email" value={familiaForm.email}
                  onChange={(e) => setFamiliaForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-medium mb-1 block">Teléfono</label>
                <input
                  type="tel" value={familiaForm.telefono} inputMode="numeric"
                  onChange={(e) => setFamiliaForm((f) => ({ ...f, telefono: e.target.value.replace(/\D/g, "") }))}
                  placeholder="3171234567"
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
                />
              </div>
            </div>

            {session.estado_pago === "Pendiente" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <p className="text-yellow-700 text-[11px]">
                  <strong>Pre-registro:</strong> tu familiar quedará registrado pero se activará cuando tu cuenta sea aprobada.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowFamiliaForm(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={familiaLoading}
                className="flex-1 bg-jungle-dark text-white text-xs font-semibold py-2 rounded-lg hover:bg-jungle transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {familiaLoading ? "Guardando..." : session.estado_pago === "Pendiente" ? "Pre-registrar familiar" : "Agregar familiar"}
              </button>
            </div>
          </form>
        )}
      </div>

      </>)}
    </div>
  );
}
