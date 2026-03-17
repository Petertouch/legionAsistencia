"use client";

import { useState, useEffect } from "react";
import { useReferralStore, type Referral } from "@/lib/stores/referral-store";
import Button from "@/components/ui/button";
import { Gift, Check, Clock, Phone, Mail, User, DollarSign, Copy, MessageCircle, Search, Filter } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pendiente: { label: "Pendiente", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Clock },
  contactado: { label: "Contactado", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Phone },
  cerrado: { label: "Cerrado", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: Check },
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

export default function RecomendacionesPage() {
  const { referrals, updateStatus, closeReferral, updateNotes } = useReferralStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const filtered = referrals.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.referrer_name.toLowerCase().includes(q) || r.referred_name.toLowerCase().includes(q) || r.referred_phone.includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalDeuda = referrals.filter((r) => r.status === "cerrado").reduce((sum, r) => sum + r.deuda, 0);
  const pendientes = referrals.filter((r) => r.status === "pendiente").length;
  const cerrados = referrals.filter((r) => r.status === "cerrado").length;

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/r/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  const handleSaveNotes = (id: string) => {
    updateNotes(id, notesValue);
    setEditingNotes(null);
    toast.success("Notas guardadas");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white text-lg md:text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-oro" /> Recomendaciones
          </h2>
          <p className="text-beige/40 text-xs md:text-sm mt-0.5">
            Programa de referidos — $50.000 por cada cliente cerrado
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
          <p className="text-beige/40 text-[10px] md:text-xs">Total referidos</p>
          <p className="text-white text-lg md:text-2xl font-bold">{referrals.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
          <p className="text-beige/40 text-[10px] md:text-xs">Cerrados</p>
          <p className="text-green-400 text-lg md:text-2xl font-bold">{cerrados}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
          <p className="text-beige/40 text-[10px] md:text-xs">Deuda total</p>
          <p className="text-oro text-lg md:text-2xl font-bold">{formatMoney(totalDeuda)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
          <input
            type="text"
            placeholder="Buscar por nombre o telefono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 text-white placeholder-beige/30 text-sm pl-9 pr-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 text-beige/70 text-sm pl-9 pr-8 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="contactado">Contactado</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>
      </div>

      {/* Referrals List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="w-10 h-10 text-beige/20 mx-auto mb-3" />
          <p className="text-beige/40 text-sm">No hay recomendaciones{search || statusFilter ? " con ese filtro" : " todavia"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const config = STATUS_CONFIG[r.status];
            const StatusIcon = config.icon;
            return (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
                        <StatusIcon className="w-3 h-3" /> {config.label}
                      </span>
                      {r.status === "cerrado" && (
                        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full bg-oro/10 text-oro border border-oro/20">
                          <DollarSign className="w-3 h-3" /> Debe {formatMoney(r.deuda)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-beige/30 text-[10px] md:text-xs flex-shrink-0">{formatDate(r.created_at)}</span>
                </div>

                {/* People */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Referrer */}
                  <div className="bg-white/5 rounded-lg p-2.5">
                    <p className="text-beige/40 text-[10px] uppercase tracking-wider mb-1">Quien refiere</p>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-oro flex-shrink-0" />
                      <span className="text-white text-sm font-medium truncate">{r.referrer_name}</span>
                    </div>
                  </div>
                  {/* Referred */}
                  <div className="bg-white/5 rounded-lg p-2.5">
                    <p className="text-beige/40 text-[10px] uppercase tracking-wider mb-1">Referido</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-beige/40 flex-shrink-0" />
                        <span className="text-white text-sm font-medium truncate">{r.referred_name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-beige/50 text-xs">
                        <a href={`tel:+57${r.referred_phone}`} className="flex items-center gap-1 hover:text-oro transition-colors">
                          <Phone className="w-3 h-3" /> {r.referred_phone}
                        </a>
                        <a href={`mailto:${r.referred_email}`} className="flex items-center gap-1 hover:text-oro transition-colors">
                          <Mail className="w-3 h-3" /> {r.referred_email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {editingNotes === r.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Agregar nota..."
                      className="flex-1 bg-white/5 text-white placeholder-beige/30 text-xs px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleSaveNotes(r.id)}>Guardar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingNotes(null)}>X</Button>
                  </div>
                ) : r.notes ? (
                  <p className="text-beige/40 text-xs cursor-pointer hover:text-beige/60" onClick={() => { setEditingNotes(r.id); setNotesValue(r.notes); }}>
                    📝 {r.notes}
                  </p>
                ) : null}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleCopyLink(r.code)}
                    className="flex items-center gap-1.5 text-xs text-beige/50 hover:text-oro bg-white/5 px-2.5 py-1.5 rounded-lg hover:bg-oro/10 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copiar link
                  </button>
                  <a
                    href={`https://wa.me/57${r.referred_phone}?text=Hola%20${encodeURIComponent(r.referred_name)},%20te%20recomendaron%20Legion%20Juridica.%20Mira%20nuestros%20servicios%20en%20${encodeURIComponent(window?.location?.origin || '')}/r/${r.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-beige/50 hover:text-green-400 bg-white/5 px-2.5 py-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </a>
                  {r.status !== "cerrado" && (
                    <>
                      {r.status === "pendiente" && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "contactado")}>
                          Marcar contactado
                        </Button>
                      )}
                      <Button size="sm" onClick={() => closeReferral(r.id)}>
                        <Check className="w-3 h-3 mr-1" /> Cerrar — {formatMoney(50000)}
                      </Button>
                    </>
                  )}
                  {!editingNotes && (
                    <button
                      onClick={() => { setEditingNotes(r.id); setNotesValue(r.notes); }}
                      className="text-xs text-beige/30 hover:text-beige/60 transition-colors"
                    >
                      {r.notes ? "Editar nota" : "+ Nota"}
                    </button>
                  )}
                </div>

                {r.status === "cerrado" && r.closed_at && (
                  <p className="text-green-400/60 text-[10px]">
                    ✅ Cerrado el {formatDate(r.closed_at)} — Se le debe {formatMoney(r.deuda)} a {r.referrer_name}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pending debt summary */}
      {totalDeuda > 0 && (
        <div className="bg-oro/5 border border-oro/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-oro font-bold text-sm">Deuda total por referidos</p>
            <p className="text-beige/40 text-xs">{cerrados} referido{cerrados !== 1 ? "s" : ""} cerrado{cerrados !== 1 ? "s" : ""} pendientes de pago</p>
          </div>
          <p className="text-oro text-xl md:text-2xl font-bold">{formatMoney(totalDeuda)}</p>
        </div>
      )}
    </div>
  );
}
