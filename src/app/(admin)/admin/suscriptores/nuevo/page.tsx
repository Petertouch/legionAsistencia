"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { createSuscriptor } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const RANGOS: Record<string, { value: string; label: string }[]> = {
  Ejercito: [
    { value: "General", label: "General" },
    { value: "Mayor General", label: "Mayor General" },
    { value: "Brigadier General", label: "Brigadier General" },
    { value: "Coronel", label: "Coronel" },
    { value: "Teniente Coronel", label: "Teniente Coronel" },
    { value: "Mayor", label: "Mayor" },
    { value: "Capitan", label: "Capitan" },
    { value: "Teniente", label: "Teniente" },
    { value: "Subteniente", label: "Subteniente" },
    { value: "Sargento Mayor", label: "Sargento Mayor" },
    { value: "Sargento Primero", label: "Sargento Primero" },
    { value: "Sargento Viceprimero", label: "Sargento Viceprimero" },
    { value: "Sargento Segundo", label: "Sargento Segundo" },
    { value: "Cabo Primero", label: "Cabo Primero" },
    { value: "Cabo Segundo", label: "Cabo Segundo" },
    { value: "Cabo Tercero", label: "Cabo Tercero" },
    { value: "Soldado Profesional", label: "Soldado Profesional" },
    { value: "Soldado Regular", label: "Soldado Regular" },
    { value: "Soldado Campesino", label: "Soldado Campesino" },
    { value: "Retirado", label: "Retirado" },
  ],
  Armada: [
    { value: "Almirante", label: "Almirante" },
    { value: "Vicealmirante", label: "Vicealmirante" },
    { value: "Contraalmirante", label: "Contraalmirante" },
    { value: "Capitan de Navio", label: "Capitan de Navio" },
    { value: "Capitan de Fragata", label: "Capitan de Fragata" },
    { value: "Capitan de Corbeta", label: "Capitan de Corbeta" },
    { value: "Teniente de Navio", label: "Teniente de Navio" },
    { value: "Teniente de Fragata", label: "Teniente de Fragata" },
    { value: "Teniente de Corbeta", label: "Teniente de Corbeta" },
    { value: "Suboficial Jefe Tecnico", label: "Suboficial Jefe Tecnico" },
    { value: "Suboficial Jefe", label: "Suboficial Jefe" },
    { value: "Suboficial Primero", label: "Suboficial Primero" },
    { value: "Suboficial Segundo", label: "Suboficial Segundo" },
    { value: "Suboficial Tercero", label: "Suboficial Tercero" },
    { value: "Infante de Marina Profesional", label: "Infante de Marina Profesional" },
    { value: "Marinero", label: "Marinero" },
    { value: "Retirado", label: "Retirado" },
  ],
  "Fuerza Aerea": [
    { value: "General del Aire", label: "General del Aire" },
    { value: "Mayor General del Aire", label: "Mayor General del Aire" },
    { value: "Brigadier General del Aire", label: "Brigadier General del Aire" },
    { value: "Coronel", label: "Coronel" },
    { value: "Teniente Coronel", label: "Teniente Coronel" },
    { value: "Mayor", label: "Mayor" },
    { value: "Capitan", label: "Capitan" },
    { value: "Teniente", label: "Teniente" },
    { value: "Subteniente", label: "Subteniente" },
    { value: "Suboficial Tecnico Jefe", label: "Suboficial Tecnico Jefe" },
    { value: "Suboficial Tecnico", label: "Suboficial Tecnico" },
    { value: "Suboficial Primero", label: "Suboficial Primero" },
    { value: "Suboficial Segundo", label: "Suboficial Segundo" },
    { value: "Suboficial Tercero", label: "Suboficial Tercero" },
    { value: "Aerotecnico", label: "Aerotecnico" },
    { value: "Retirado", label: "Retirado" },
  ],
  Policia: [
    { value: "General", label: "General" },
    { value: "Mayor General", label: "Mayor General" },
    { value: "Brigadier General", label: "Brigadier General" },
    { value: "Coronel", label: "Coronel" },
    { value: "Teniente Coronel", label: "Teniente Coronel" },
    { value: "Mayor", label: "Mayor" },
    { value: "Capitan", label: "Capitan" },
    { value: "Teniente", label: "Teniente" },
    { value: "Subteniente", label: "Subteniente" },
    { value: "Comisario", label: "Comisario" },
    { value: "Subcomisario", label: "Subcomisario" },
    { value: "Intendente Jefe", label: "Intendente Jefe" },
    { value: "Intendente", label: "Intendente" },
    { value: "Subintendente", label: "Subintendente" },
    { value: "Patrullero", label: "Patrullero" },
    { value: "Auxiliar de Policia", label: "Auxiliar de Policia" },
    { value: "Retirado", label: "Retirado" },
  ],
};

export default function NuevoSuscriptorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [rama, setRama] = useState("");

  const rangosDisponibles = rama ? RANGOS[rama] || [] : [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await createSuscriptor({
      nombre: form.get("nombre") as string,
      telefono: form.get("telefono") as string,
      email: form.get("email") as string,
      plan: form.get("plan") as "Base" | "Plus" | "Elite",
      estado_pago: form.get("estado_pago") as "Al dia" | "Pendiente" | "Vencido",
      rama: form.get("rama") as string,
      rango: form.get("rango") as string,
      notas: form.get("notas") as string,
    });
    queryClient.invalidateQueries({ queryKey: ["suscriptores"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    toast.success("Suscriptor creado exitosamente");
    router.push("/admin/suscriptores");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/suscriptores" className="text-beige/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-white text-xl font-bold">Nuevo Suscriptor</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-5">
        <Input label="Nombre completo" name="nombre" placeholder="Juan Perez" required />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Telefono" name="telefono" type="tel" placeholder="3176689580" />
          <Input label="Email" name="email" type="email" placeholder="correo@mail.com" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Plan" name="plan" options={[
            { value: "Base", label: "Base — $50.000/mes" },
            { value: "Plus", label: "Plus — $66.000/mes" },
            { value: "Elite", label: "Elite — $80.000/mes" },
          ]} />
          <Select label="Estado de pago" name="estado_pago" options={[
            { value: "Al dia", label: "Al dia" },
            { value: "Pendiente", label: "Pendiente" },
            { value: "Vencido", label: "Vencido" },
          ]} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Rama" name="rama" placeholder="Seleccionar rama..." value={rama}
            onChange={(e) => setRama(e.target.value)}
            options={[
              { value: "Ejercito", label: "Ejercito Nacional" },
              { value: "Armada", label: "Armada Nacional" },
              { value: "Fuerza Aerea", label: "Fuerza Aerea Colombiana" },
              { value: "Policia", label: "Policia Nacional" },
            ]} />
          <Select label="Rango" name="rango" placeholder={rama ? "Seleccionar rango..." : "Primero selecciona rama"}
            disabled={!rama} options={rangosDisponibles} />
        </div>

        <Input label="Notas" name="notas" placeholder="Notas adicionales..." />

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/suscriptores"><Button type="button" variant="ghost">Cancelar</Button></Link>
          <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Crear Suscriptor"}</Button>
        </div>
      </form>
    </div>
  );
}
