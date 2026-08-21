"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Sparkles, UserPlus, Trash2, Plus, FileText, AlertTriangle } from "lucide-react";

interface Beneficiario { nombre: string; edad: string; parentesco: string }
interface Ficha {
  nombre: string; cedula: string; telefono: string; telefono2: string; email: string;
  estado_civil: string; grado: string; fuerza: string; unidad: string;
  direccion: string; ciudad: string; departamento: string;
  plan: string; precio: string; fecha: string;
  beneficiarios: Beneficiario[]; confianza_baja: string[];
}

const EMPTY: Ficha = {
  nombre: "", cedula: "", telefono: "", telefono2: "", email: "", estado_civil: "",
  grado: "", fuerza: "", unidad: "", direccion: "", ciudad: "", departamento: "",
  plan: "Base", precio: "", fecha: "", beneficiarios: [], confianza_baja: [],
};

const input = "w-full bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/40 focus:outline-none";
const dudoso = "border-amber-400 bg-amber-50 focus:border-amber-500";

export default function ContratoUploader({ onCreated }: { onCreated: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState<"" | "extract" | "create">("");
  const [pdfMeta, setPdfMeta] = useState<{ pdf_bucket: string; pdf_original_path: string; pdf_filename: string } | null>(null);
  const [form, setForm] = useState<Ficha>(EMPTY);
  const [warn, setWarn] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const set = (k: keyof Ficha, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isDudoso = (k: string) => form.confianza_baja?.includes(k);

  const reset = () => {
    setForm(EMPTY); setPdfMeta(null); setWarn(null); setReady(false);
    setFilename(""); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPick = async (file: File) => {
    if (file.type !== "application/pdf") { toast.error("Solo PDFs"); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setFilename(file.name);
    setReady(false);
    setWarn(null);
    setBusy("extract");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/contratos/upload-extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error subiendo"); setBusy(""); return; }
      setPdfMeta({ pdf_bucket: data.pdf_bucket, pdf_original_path: data.pdf_original_path, pdf_filename: data.pdf_filename });
      if (data.extracted) {
        setForm({ ...EMPTY, ...data.extracted, plan: data.extracted.plan || "Base" });
        toast.success("Datos extraídos con IA — revísalos antes de crear");
      } else {
        setForm({ ...EMPTY, fecha: new Date().toISOString().slice(0, 10) });
        setWarn(data.extractError || "No se pudo extraer automáticamente. Llena los campos a mano.");
      }
      setReady(true);
    } catch {
      toast.error("Error de red");
    } finally {
      setBusy("");
    }
  };

  const addBenef = () => setForm((f) => ({ ...f, beneficiarios: [...f.beneficiarios, { nombre: "", edad: "", parentesco: "" }] }));
  const setBenef = (i: number, k: keyof Beneficiario, v: string) =>
    setForm((f) => ({ ...f, beneficiarios: f.beneficiarios.map((b, j) => (j === i ? { ...b, [k]: v } : b)) }));
  const delBenef = (i: number) => setForm((f) => ({ ...f, beneficiarios: f.beneficiarios.filter((_, j) => j !== i) }));

  const crear = async () => {
    if (!form.nombre.trim() || !form.cedula.trim()) { toast.error("Nombre y cédula son obligatorios"); return; }
    setBusy("create");
    try {
      const res = await fetch("/api/contratos/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...pdfMeta }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error creando afiliado"); setBusy(""); return; }
      toast.success(`Afiliado creado (Pendiente) · ${data.beneficiarios} beneficiario(s) · sin correo`);
      reset();
      onCreated();
    } catch {
      toast.error("Error de red");
    } finally {
      setBusy("");
    }
  };

  const Field = ({ label, k, type = "text" }: { label: string; k: keyof Ficha; type?: string }) => (
    <div>
      <label className="text-gray-500 text-xs font-medium mb-1 block">
        {label} {isDudoso(k) && <span className="text-amber-600">⚠</span>}
      </label>
      <input type={type} value={form[k] as string} onChange={(e) => set(k, e.target.value)}
        className={`${input} ${isDudoso(k) ? dudoso : ""}`} />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4 text-oro" />
            {filename ? <span className="font-medium text-gray-900">{filename}</span> : <span>Sube el PDF del contrato firmado (escaneado)</span>}
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={busy === "extract"}
            className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">
            {busy === "extract" ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo y extrayendo…</> : <><Upload className="w-4 h-4" /> {filename ? "Cambiar PDF" : "Elegir PDF"}</>}
          </button>
        </div>
        <p className="text-gray-400 text-[11px] mt-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Se sube a un bucket privado y la IA extrae los datos. Revisa antes de crear. No se envía ningún correo.
        </p>
      </div>

      {ready && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div>
            <h3 className="text-gray-900 font-bold text-sm mb-2">Vista previa del PDF</h3>
            {previewUrl && (
              <iframe src={previewUrl} title="Contrato" className="w-full h-[75vh] border border-gray-200 rounded-xl bg-gray-50" />
            )}
          </div>

          {/* Formulario editable */}
          <div className="space-y-4">
            <h3 className="text-gray-900 font-bold text-sm">Datos extraídos (editables)</h3>
            {warn && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{warn}</span>
              </div>
            )}
            {form.confianza_baja?.length > 0 && (
              <p className="text-amber-600 text-[11px]">⚠ Campos marcados = la IA no está segura por la letra a mano; verifícalos.</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Field label="Nombre completo" k="nombre" /></div>
              <Field label="Cédula" k="cedula" />
              <Field label="Fecha del contrato" k="fecha" type="date" />
              <Field label="Teléfono 1" k="telefono" />
              <Field label="Teléfono 2" k="telefono2" />
              <div className="col-span-2"><Field label="Email" k="email" /></div>
              <Field label="Estado civil" k="estado_civil" />
              <Field label="Grado" k="grado" />
              <Field label="Fuerza / Rama" k="fuerza" />
              <Field label="Unidad" k="unidad" />
              <div className="col-span-2"><Field label="Dirección" k="direccion" /></div>
              <Field label="Ciudad" k="ciudad" />
              <Field label="Departamento" k="departamento" />
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1 block">Plan</label>
                <select value={form.plan} onChange={(e) => set("plan", e.target.value)} className={input}>
                  {["Base", "Plus", "Élite"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <Field label="Valor cuota" k="precio" />
            </div>

            {/* Beneficiarios */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-gray-700 font-semibold text-xs">Beneficiarios</h4>
                <button onClick={addBenef} className="text-oro text-xs font-medium flex items-center gap-1 hover:underline">
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>
              <div className="space-y-2">
                {form.beneficiarios.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input placeholder="Nombre" value={b.nombre} onChange={(e) => setBenef(i, "nombre", e.target.value)} className={`${input} flex-1`} />
                    <input placeholder="Edad" value={b.edad} onChange={(e) => setBenef(i, "edad", e.target.value)} className={`${input} w-16`} />
                    <input placeholder="Parentesco" value={b.parentesco} onChange={(e) => setBenef(i, "parentesco", e.target.value)} className={`${input} w-32`} />
                    <button onClick={() => delBenef(i)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {form.beneficiarios.length === 0 && <p className="text-gray-400 text-xs">Sin beneficiarios.</p>}
              </div>
            </div>

            <button onClick={crear} disabled={busy === "create"}
              className="w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
              {busy === "create" ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando…</> : <><UserPlus className="w-4 h-4" /> Crear afiliado (Pendiente · sin correo)</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
