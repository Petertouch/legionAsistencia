"use client";

import { useState } from "react";
import { useTeamStore } from "@/lib/stores/team-store";
import { updateCaso } from "@/lib/db";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

// Asignación/reasignación inline del abogado de un caso.
// Reutilizable en la tarjeta kanban y en la fila de tabla (fuera del detalle).
export default function AbogadoAssign({
  casoId,
  current,
  onSaved,
  className = "",
}: {
  casoId: string;
  current: string;
  onSaved?: () => void;
  className?: string;
}) {
  const abogados = useTeamStore((s) => s.abogados);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const active = abogados
    .filter((a) => a.role === "abogado" && a.estado === "activo")
    .map((a) => a.nombre);
  // Incluye el abogado actual aunque esté inactivo o sea un nombre legacy.
  const options = current && !active.includes(current) ? [current, ...active] : active;

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const save = async (nombre: string) => {
    if (!nombre || nombre === current) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await updateCaso(casoId, { abogado: nombre });
    setSaving(false);
    setEditing(false);
    toast.success(`Caso reasignado a ${nombre}`);
    onSaved?.();
  };

  if (editing) {
    return (
      <select
        autoFocus
        disabled={saving}
        defaultValue={current || ""}
        onClick={stop}
        onPointerDown={stop}
        onMouseDown={stop}
        onChange={(e) => save(e.target.value)}
        onBlur={() => setEditing(false)}
        className={`bg-white border border-oro/40 text-gray-900 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-oro/30 disabled:opacity-50 ${className}`}
      >
        {!current && <option value="">Sin asignar</option>}
        {options.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => { stop(e); setEditing(true); }}
      onPointerDown={stop}
      onMouseDown={stop}
      className={`group/abg inline-flex items-center gap-1 hover:text-oro transition-colors ${className}`}
      title="Reasignar abogado"
    >
      <span className="truncate">{current || "Sin asignar"}</span>
      <Pencil className="w-3 h-3 opacity-0 group-hover/abg:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
}
