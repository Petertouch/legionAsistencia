"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSuscriptor, getCasosBySuscriptor, getSeguimientos, getDocumentosBySuscriptor, createDocumento, deleteDocumento, updateSuscriptor, setSuscriptorClave } from "@/lib/db";
import type { DocumentoContrato, Suscriptor } from "@/lib/mock-data";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, Phone, Calendar, Scale, MessageSquare, StickyNote,
  FileText, Upload, Trash2, File, X, Download, Plus, KeyRound, Pencil, Save,
} from "lucide-react";

const ESTADOS_PAGO: Suscriptor["estado_pago"][] = ["Al dia", "Pendiente", "Vencido"];

function fmtDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}
function fmtDateTime(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function Field({ label, value, mono, className = "" }: { label: string; value?: string | null; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <p className="text-gray-400 text-[10px] uppercase tracking-wide">{label}</p>
      <p className={`text-gray-900 text-sm break-words ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</p>
    </div>
  );
}
function EditField({ label, value, onChange, type = "text", hint, className = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-gray-500 text-[11px] font-medium mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/40 focus:outline-none"
      />
      {hint && <p className="text-gray-400 text-[10px] mt-1">{hint}</p>}
    </div>
  );
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  llamada: <Phone className="w-4 h-4" />, whatsapp: <MessageSquare className="w-4 h-4" />,
  reunion: <Calendar className="w-4 h-4" />, nota: <StickyNote className="w-4 h-4" />,
};

const DOC_TIPO_LABEL: Record<DocumentoContrato["tipo"], string> = {
  contrato: "Contrato",
  anexo: "Anexo",
  identificacion: "Identificación",
  otro: "Otro",
};

const DOC_TIPO_COLORS: Record<DocumentoContrato["tipo"], string> = {
  contrato: "bg-amber-50 text-oro",
  anexo: "bg-blue-500/10 text-blue-600",
  identificacion: "bg-green-500/10 text-green-600",
  otro: "bg-gray-100 text-gray-500",
};

export default function SuscriptorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: suscriptor, isLoading } = useQuery({ queryKey: ["suscriptor", id], queryFn: () => getSuscriptor(id) });
  const { data: casos } = useQuery({ queryKey: ["casos-suscriptor", id], queryFn: () => getCasosBySuscriptor(id) });
  const { data: seguimientos } = useQuery({ queryKey: ["seguimientos", { suscriptor_id: id }], queryFn: () => getSeguimientos({ suscriptor_id: id }) });
  const { data: documentos } = useQuery({ queryKey: ["documentos", id], queryFn: () => getDocumentosBySuscriptor(id) });

  const [showUpload, setShowUpload] = useState(false);
  const [docForm, setDocForm] = useState({ nombre: "", tipo: "contrato" as DocumentoContrato["tipo"] });

  const addDocMutation = useMutation({
    mutationFn: (file: File) =>
      createDocumento({
        suscriptor_id: id,
        nombre: docForm.nombre || file.name,
        tipo: docForm.tipo,
        archivo_url: URL.createObjectURL(file),
        tamano: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        subido_por: "Admin",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", id] });
      setShowUpload(false);
      setDocForm({ nombre: "", tipo: "contrato" });
      toast.success("Documento subido");
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => deleteDocumento(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", id] });
      toast.success("Documento eliminado");
    },
  });

  const [nuevaClave, setNuevaClave] = useState("");
  const [forzarCambio, setForzarCambio] = useState(false);
  const [savingClave, setSavingClave] = useState(false);
  const handleSetClave = async () => {
    if (nuevaClave.trim().length < 6) { toast.error("La clave debe tener al menos 6 caracteres"); return; }
    setSavingClave(true);
    try {
      await setSuscriptorClave(id, nuevaClave.trim(), forzarCambio);
      setNuevaClave("");
      setForzarCambio(false);
      queryClient.invalidateQueries({ queryKey: ["suscriptor", id] });
      toast.success("Clave actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar la clave");
    } finally {
      setSavingClave(false);
    }
  };

  const [approving, setApproving] = useState(false);
  const handleAprobar = async () => {
    setApproving(true);
    try {
      await updateSuscriptor(id, { estado_pago: "Al dia" });
      queryClient.invalidateQueries({ queryKey: ["suscriptor", id] });
      queryClient.invalidateQueries({ queryKey: ["suscriptores-pendientes"] });
      queryClient.invalidateQueries({ queryKey: ["suscriptores-activos"] });
      toast.success("Suscriptor aprobado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aprobar");
    } finally {
      setApproving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addDocMutation.mutate(file);
  };

  // ── Editar datos del cliente ──
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [form, setForm] = useState({
    nombre: "", cedula: "", telefono: "", email: "",
    plan: "", estado_pago: "" as string, rama: "", rango: "", notas: "",
  });
  const startEdit = () => {
    if (!suscriptor) return;
    setForm({
      nombre: suscriptor.nombre || "", cedula: suscriptor.cedula || "",
      telefono: suscriptor.telefono || "", email: suscriptor.email || "",
      plan: suscriptor.plan || "", estado_pago: suscriptor.estado_pago || "Al dia",
      rama: suscriptor.rama || "", rango: suscriptor.rango || "", notas: suscriptor.notas || "",
    });
    setEditing(true);
  };
  const upd = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const handleSaveEdit = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSavingEdit(true);
    try {
      await updateSuscriptor(id, {
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        plan: form.plan.trim() as Suscriptor["plan"],
        estado_pago: form.estado_pago as Suscriptor["estado_pago"],
        rama: form.rama.trim(),
        rango: form.rango.trim(),
        notas: form.notas.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["suscriptor", id] });
      queryClient.invalidateQueries({ queryKey: ["suscriptores-activos"] });
      queryClient.invalidateQueries({ queryKey: ["suscriptores-pendientes"] });
      setEditing(false);
      toast.success("Datos actualizados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSavingEdit(false);
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-50 rounded-xl" />)}</div>;

  if (!suscriptor) return (
    <div className="max-w-md mx-auto text-center py-16 space-y-4">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
        <Scale className="w-7 h-7 text-gray-300" />
      </div>
      <div>
        <h2 className="text-gray-900 font-bold text-lg">Suscriptor no encontrado</h2>
        <p className="text-gray-500 text-sm mt-1">No existe ningún suscriptor con el identificador <span className="font-mono text-gray-600">{id}</span>.</p>
      </div>
      <Link href="/admin/suscriptores"><Button variant="secondary" size="sm"><ArrowLeft className="w-4 h-4" /> Volver a suscriptores</Button></Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/suscriptores" className="text-gray-400 hover:text-gray-900 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h2 className="text-gray-900 text-xl font-bold">{suscriptor.nombre}</h2>
          <p className="text-gray-500 text-sm">{suscriptor.rango} — {suscriptor.rama}</p>
        </div>
        <Badge>{suscriptor.plan}</Badge>
        <Badge>{suscriptor.estado_pago}</Badge>
      </div>

      {suscriptor.estado_pago === "Pendiente" && (
        <div className="bg-yellow-500/10 border border-yellow-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-yellow-600 font-bold text-sm">Suscriptor pendiente de aprobación</p>
            <p className="text-yellow-600/60 text-xs mt-0.5">Este suscriptor firmó su contrato pero aún no ha sido aprobado.</p>
          </div>
          <button
            onClick={handleAprobar}
            disabled={approving}
            className="bg-green-600 hover:bg-green-700 text-gray-900 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex-shrink-0 disabled:opacity-50"
          >
            {approving ? "Aprobando..." : "Aprobar"}
          </button>
        </div>
      )}

      {/* Datos completos del cliente */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <Scale className="w-4 h-4 text-oro" /> Datos del cliente
          </h3>
          {!editing ? (
            <Button size="sm" variant="secondary" onClick={startEdit}>
              <Pencil className="w-3.5 h-3.5" /> Editar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)} disabled={savingEdit}>
                <X className="w-3.5 h-3.5" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit}>
                <Save className="w-3.5 h-3.5" /> {savingEdit ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3.5">
            <Field label="Nombre" value={suscriptor.nombre} />
            <Field label="Cédula" value={suscriptor.cedula} mono />
            <Field label="Teléfono" value={suscriptor.telefono} />
            <Field label="Email" value={suscriptor.email} className="col-span-2 md:col-span-1" />
            <Field label="Plan" value={suscriptor.plan} />
            <Field label="Estado de pago" value={suscriptor.estado_pago} />
            <Field label="Rama" value={suscriptor.rama} />
            <Field label="Rango" value={suscriptor.rango} />
            <Field label="Suscrito desde" value={fmtDate(suscriptor.fecha_inicio)} />
            <Field label="Registrado" value={fmtDateTime(suscriptor.created_at)} />
            <Field label="Última actualización" value={fmtDateTime(suscriptor.updated_at)} />
            <Field label="ID contrato" value={suscriptor.contrato_id || "—"} mono />
            <Field label="ID suscriptor" value={suscriptor.id} mono className="col-span-2 md:col-span-3" />
            {suscriptor.notas && <Field label="Notas" value={suscriptor.notas} className="col-span-2 md:col-span-3" />}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <EditField label="Nombre" value={form.nombre} onChange={(v) => upd("nombre", v)} />
            <EditField label="Cédula" value={form.cedula} onChange={(v) => upd("cedula", v)} />
            <EditField label="Teléfono" value={form.telefono} onChange={(v) => upd("telefono", v)} />
            <EditField label="Email" value={form.email} onChange={(v) => upd("email", v)} type="email" hint="Es el usuario de login del cliente" className="sm:col-span-2 md:col-span-1" />
            <EditField label="Plan" value={form.plan} onChange={(v) => upd("plan", v)} />
            <div>
              <label className="text-gray-500 text-[11px] font-medium mb-1 block">Estado de pago</label>
              <select
                value={form.estado_pago}
                onChange={(e) => upd("estado_pago", e.target.value)}
                className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/40 focus:outline-none appearance-none cursor-pointer"
              >
                {ESTADOS_PAGO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <EditField label="Rama / Fuerza" value={form.rama} onChange={(v) => upd("rama", v)} />
            <EditField label="Rango" value={form.rango} onChange={(v) => upd("rango", v)} />
            <div className="sm:col-span-2 md:col-span-3">
              <label className="text-gray-500 text-[11px] font-medium mb-1 block">Notas</label>
              <textarea
                value={form.notas}
                onChange={(e) => upd("notas", e.target.value)}
                rows={2}
                className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/40 focus:outline-none resize-y"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Acceso del cliente — cambiar clave */}
      <Card>
        <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2 mb-2">
          <KeyRound className="w-4 h-4 text-oro" /> Acceso del cliente
        </h3>
        <p className="text-gray-500 text-xs mb-3">
          El cliente inicia sesión en <span className="font-mono">/mi-caso</span>{" "}
          {(process.env.NEXT_PUBLIC_CLIENT_AUTH_PROVIDER || "legacy") === "supabase" ? (
            <>con su <strong className="text-gray-700">correo</strong> (<strong className="text-gray-700">{suscriptor.email || "sin correo"}</strong>) y su clave.</>
          ) : (
            <>con su cédula (<strong className="text-gray-700">{suscriptor.cedula}</strong>) y su clave.</>
          )}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="text-gray-500 text-xs font-medium mb-1 block">Nueva clave</label>
            <input
              type="text"
              value={nuevaClave}
              onChange={(e) => setNuevaClave(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/40 focus:outline-none font-mono"
            />
          </div>
          <button
            onClick={handleSetClave}
            disabled={savingClave || nuevaClave.trim().length < 6}
            className="bg-oro hover:bg-oro/90 text-jungle-dark font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <KeyRound className="w-4 h-4" /> {savingClave ? "Guardando..." : "Cambiar clave"}
          </button>
        </div>
        <label className="flex items-center gap-2 mt-3 text-xs text-gray-600 cursor-pointer w-fit">
          <input type="checkbox" checked={forzarCambio} onChange={(e) => setForzarCambio(e.target.checked)} className="rounded border-gray-300 accent-oro" />
          Obligar al cliente a cambiarla en su próximo inicio de sesión
        </label>
        {suscriptor.debe_cambiar_clave && (
          <p className="text-yellow-600 text-[11px] mt-2">⚠ Actualmente el cliente debe cambiar su clave al ingresar.</p>
        )}
      </Card>

      {/* Documentos del contrato */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-oro" /> Documentos del contrato ({documentos?.length || 0})
          </h3>
          <Button size="sm" variant="secondary" onClick={() => setShowUpload(!showUpload)}>
            {showUpload ? <><X className="w-3.5 h-3.5" /> Cancelar</> : <><Plus className="w-3.5 h-3.5" /> Subir documento</>}
          </Button>
        </div>

        {/* Upload form */}
        {showUpload && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1 block">Nombre del documento</label>
                <input
                  type="text"
                  value={docForm.nombre}
                  onChange={(e) => setDocForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Contrato de prestación de servicios"
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1 block">Tipo</label>
                <select
                  value={docForm.tipo}
                  onChange={(e) => setDocForm((f) => ({ ...f, tipo: e.target.value as DocumentoContrato["tipo"] }))}
                  className="w-full bg-gray-50 text-gray-600 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/40 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="contrato">Contrato</option>
                  <option value="anexo">Anexo</option>
                  <option value="identificacion">Identificación</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
            <label className="flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-200 hover:border-oro/30 rounded-xl cursor-pointer transition-colors group">
              <Upload className="w-6 h-6 text-gray-400 group-hover:text-oro transition-colors" />
              <span className="text-gray-400 text-xs group-hover:text-gray-500 transition-colors">
                Click para seleccionar archivo (PDF, Word, imagen)
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        )}

        {/* Documents list */}
        {!documentos || documentos.length === 0 ? (
          <div className="text-center py-8">
            <File className="w-8 h-8 text-beige/15 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Sin documentos</p>
            <p className="text-gray-300 text-xs mt-1">Sube contratos, anexos o identificaciones del suscriptor</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documentos.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-white transition-colors group">
                <div className="p-2 rounded-lg bg-gray-50 flex-shrink-0">
                  <FileText className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium truncate">{doc.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${DOC_TIPO_COLORS[doc.tipo]}`}>
                      {DOC_TIPO_LABEL[doc.tipo]}
                    </span>
                    <span className="text-gray-400 text-[10px]">{doc.tamano}</span>
                    <span className="text-gray-400 text-[10px]">
                      {new Date(doc.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={doc.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-oro transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => deleteDocMutation.mutate(doc.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2"><Scale className="w-4 h-4 text-oro" /> Casos ({casos?.length || 0})</h3>
          <Link href={`/admin/casos/nuevo?suscriptor=${id}`}><Button size="sm" variant="secondary">+ Nuevo caso</Button></Link>
        </div>
        {casos?.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin casos registrados</p>
        ) : (
          <div className="space-y-2">
            {casos?.map((c) => (
              <Link key={c.id} href={`/admin/casos/${c.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div>
                  <p className="text-gray-900 text-sm">{c.titulo}</p>
                  <p className="text-gray-400 text-xs">{c.area} — {c.etapa}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{c.prioridad}</Badge>
                  <span className="text-gray-400 text-xs">{c.abogado}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-gray-900 font-bold text-sm mb-4">Seguimiento</h3>
        {seguimientos?.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin actividad registrada</p>
        ) : (
          <div className="space-y-3">
            {seguimientos?.map((seg) => (
              <div key={seg.id} className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-gray-50 text-gray-500">{TIPO_ICONS[seg.tipo]}</div>
                <div>
                  <p className="text-gray-600 text-sm">{seg.descripcion}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(seg.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {seg.caso_area && ` — ${seg.caso_area}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}