"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTeamStore } from "@/lib/stores/team-store";
import type { CaseArea } from "@/lib/pipelines";
import Button from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40";
const labelCls = "text-gray-500 text-xs font-medium mb-1.5 block";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#ef4444", "#a855f7", "#06b6d4"];

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function NuevoVendedorPage() {
  const router = useRouter();
  const addMember = useTeamStore((s) => s.addMember);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cedula, setCedula] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [password, setPassword] = useState("");
  const [comision, setComision] = useState("50000");
  const [color] = useState(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [notas, setNotas] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) {
      toast.error("Nombre y email son requeridos");
      return;
    }

    addMember({
      role: "vendedor",
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefono,
      cedula,
      estado: "activo",
      fecha_ingreso: new Date().toISOString().slice(0, 10),
      password,
      color,
      notas,
      areas_habilitadas: [] as CaseArea[],
      especialidad: "Disciplinario" as CaseArea,
      max_casos: 0,
      especialidad_academica: "",
      bio: "",
      avatar_url: "",
      comision_porcentaje: parseInt(comision) || 50000,
      vendedor_code: generateCode(),
      ciudad,
    });

    toast.success(`Vendedor ${nombre} creado`);
    router.push("/admin/vendedores");
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/vendedores" className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-gray-900 text-xl font-bold">Nuevo vendedor</h1>
          <p className="text-gray-400 text-sm mt-0.5">Se le asignará un código único para su link de referido</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Nombre completo *</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} placeholder="Juan Pérez" required />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="juan@email.com" required />
          </div>
          <div>
            <label className={labelCls}>Teléfono</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputCls} placeholder="3001234567" />
          </div>
          <div>
            <label className={labelCls}>Cédula</label>
            <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} className={inputCls} placeholder="1234567890" />
          </div>
          <div>
            <label className={labelCls}>Ciudad</label>
            <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} className={inputCls} placeholder="Bogotá" />
          </div>
          <div>
            <label className={labelCls}>Comisión por cierre (COP)</label>
            <input type="number" value={comision} onChange={(e) => setComision(e.target.value)} className={inputCls} min="0" step="1000" />
          </div>
          <div>
            <label className={labelCls}>Contraseña de acceso</label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Notas internas..." />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit"><Save className="w-4 h-4" /> Crear vendedor</Button>
        </div>
      </form>
    </div>
  );
}
