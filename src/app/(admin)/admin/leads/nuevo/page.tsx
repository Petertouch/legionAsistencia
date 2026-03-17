"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { createLead } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NuevoLeadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await createLead({
      nombre: form.get("nombre") as string,
      telefono: form.get("telefono") as string,
      email: form.get("email") as string,
      area_interes: form.get("area_interes") as string,
      fuente: form.get("fuente") as "chatbot" | "web" | "referido" | "whatsapp",
      notas: form.get("notas") as string,
    });
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    toast.success("Lead creado exitosamente");
    router.push("/admin/leads");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/leads" className="text-beige/40 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <h2 className="text-white text-xl font-bold">Nuevo Lead</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-5">
        <Input label="Nombre" name="nombre" placeholder="Juan Perez" required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Telefono" name="telefono" type="tel" placeholder="3176689580" />
          <Input label="Email" name="email" type="email" placeholder="correo@mail.com" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Area de interes" name="area_interes" placeholder="Seleccionar..." options={[
            { value: "Penal Militar", label: "Penal Militar" },
            { value: "Disciplinario", label: "Disciplinario" },
            { value: "Familia", label: "Familia" },
            { value: "Civil", label: "Civil" },
            { value: "Consumidor", label: "Consumidor" },
            { value: "Documentos", label: "Documentos" },
          ]} />
          <Select label="Fuente" name="fuente" options={[
            { value: "chatbot", label: "Chatbot" },
            { value: "web", label: "Web" },
            { value: "referido", label: "Referido" },
            { value: "whatsapp", label: "WhatsApp" },
          ]} />
        </div>
        <Input label="Notas" name="notas" placeholder="Notas sobre el lead..." />
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/leads"><Button type="button" variant="ghost">Cancelar</Button></Link>
          <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Crear Lead"}</Button>
        </div>
      </form>
    </div>
  );
}
