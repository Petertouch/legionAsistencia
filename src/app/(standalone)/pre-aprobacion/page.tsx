"use client";

import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { Loader2, LogIn, LogOut, Pencil, Check, X, ShieldCheck, Search, RotateCcw } from "lucide-react";

interface Beneficiario { nombre: string; edad?: string | number | null; parentesco?: string }
interface Row {
  id: string; contrato_id: string | null;
  nombre: string; cedula: string; telefono: string; telefono2: string; email: string;
  estado_civil: string; grado: string; fuerza: string; unidad: string;
  direccion: string; ciudad: string; departamento: string;
  plan: string; precio: string; estado_pago: string; notas: string;
  beneficiarios: Beneficiario[];
  pre_aprobado: boolean; pre_aprobado_por: string; pre_aprobado_at: string;
  tiene_pdf: boolean;
}

// Columnas del "Excel". editable define si se puede corregir.
const COLS: { key: keyof Row; label: string; editable: boolean; w: string; select?: string[] }[] = [
  { key: "nombre", label: "Nombre completo", editable: true, w: "min-w-[190px]" },
  { key: "cedula", label: "Cédula", editable: true, w: "min-w-[110px]" },
  { key: "telefono", label: "Tel 1", editable: true, w: "min-w-[110px]" },
  { key: "telefono2", label: "Tel 2", editable: true, w: "min-w-[110px]" },
  { key: "email", label: "Email", editable: true, w: "min-w-[210px]" },
  { key: "estado_civil", label: "Est. civil", editable: true, w: "min-w-[100px]" },
  { key: "grado", label: "Grado", editable: true, w: "min-w-[110px]" },
  { key: "fuerza", label: "Fuerza", editable: true, w: "min-w-[150px]" },
  { key: "unidad", label: "Unidad", editable: true, w: "min-w-[120px]" },
  { key: "direccion", label: "Dirección", editable: true, w: "min-w-[220px]" },
  { key: "ciudad", label: "Ciudad", editable: true, w: "min-w-[120px]" },
  { key: "departamento", label: "Depto", editable: true, w: "min-w-[120px]" },
  { key: "plan", label: "Plan", editable: true, w: "min-w-[90px]", select: ["Base", "Plus", "Élite"] },
  { key: "precio", label: "Valor", editable: true, w: "min-w-[90px]" },
  { key: "beneficiarios", label: "Beneficiarios", editable: false, w: "min-w-[240px]" },
  { key: "notas", label: "Notas", editable: false, w: "min-w-[220px]" },
];

const th = "px-2 py-1.5 text-left text-[11px] font-semibold text-gray-600 border border-gray-200 whitespace-nowrap bg-gray-100";
const td = "px-2 py-1 text-[11px] text-gray-800 border border-gray-200 align-top";
const inp = "w-full bg-white text-[11px] px-1.5 py-1 rounded border border-gray-300 focus:border-oro focus:outline-none";

export default function PreAprobacionPage() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = cargando
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Row>>({});
  const [saving, setSaving] = useState(false);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const load = async () => {
    const res = await fetch("/api/comercial/suscriptores");
    if (res.status === 401) { setAuthed(false); return; }
    if (!res.ok) { toast.error("Error cargando datos"); setAuthed(true); return; }
    setRows(await res.json());
    setAuthed(true);
  };

  useEffect(() => { load(); }, []);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const res = await fetch("/api/comercial/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "No se pudo entrar"); return; }
      await load();
    } finally { setLoggingIn(false); }
  };

  const logout = async () => { await fetch("/api/comercial/logout", { method: "POST" }); setAuthed(false); setRows([]); };

  const startEdit = (r: Row) => { setEditId(r.id); setForm({ ...r }); };
  const cancelEdit = () => { setEditId(null); setForm({}); };

  const patch = async (id: string, payload: object, okMsg: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/comercial/suscriptores", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error guardando"); return null; }
      setRows((prev) => prev.map((r) => (r.id === id ? data : r)));
      toast.success(okMsg);
      return data;
    } finally { setSaving(false); }
  };

  const saveEdit = async () => {
    const fields: Record<string, unknown> = {};
    for (const c of COLS) if (c.editable) fields[c.key] = form[c.key] ?? "";
    const r = await patch(editId!, { fields }, "Corregido — vuelve a pre-aprobación");
    if (r) cancelEdit();
  };

  const preAprobar = (id: string) => patch(id, { pre_aprobado: true }, "Pre-aprobado ✓");
  const quitarPre = (id: string) => patch(id, { pre_aprobado: false }, "Pre-aprobación retirada");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => `${r.nombre} ${r.cedula} ${r.email} ${r.telefono}`.toLowerCase().includes(s));
  }, [rows, q]);

  const pend = rows.filter((r) => !r.pre_aprobado).length;

  // ── Cargando ──
  if (authed === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  // ── Login ──
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Toaster position="top-center" richColors />
        <form onSubmit={doLogin} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-7 w-full max-w-sm space-y-4">
          <div className="text-center">
            <div className="w-11 h-11 rounded-xl bg-jungle-dark/5 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-6 h-6 text-oro" />
            </div>
            <h1 className="text-gray-900 font-bold text-lg">Pre-aprobación de afiliados</h1>
            <p className="text-gray-400 text-xs mt-1">Acceso del equipo comercial</p>
          </div>
          <div>
            <label className="text-gray-500 text-xs font-medium mb-1 block">Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2.5 rounded-lg border border-gray-200 focus:border-oro/40 focus:outline-none" />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-medium mb-1 block">Clave</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2.5 rounded-lg border border-gray-200 focus:border-oro/40 focus:outline-none" />
          </div>
          <button type="submit" disabled={loggingIn}
            className="w-full bg-jungle-dark text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Entrar
          </button>
        </form>
      </div>
    );
  }

  // ── Tabla ──
  return (
    <div className="min-h-screen">
      <Toaster position="top-center" richColors />
      {/* Barra superior */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-gray-900 font-bold text-sm">Pre-aprobación de afiliados</h1>
          <p className="text-gray-400 text-xs">{rows.length} afiliados · {pend} por pre-aprobar</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre, cédula…"
              className="bg-gray-50 text-gray-900 text-xs pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-oro/40 focus:outline-none w-56" />
          </div>
          <button onClick={logout} className="text-gray-500 hover:text-gray-900 text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100">
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </div>

      <p className="text-gray-400 text-[11px] px-4 pt-3">
        Corrige los datos que la IA haya leído mal y pre-aprueba. La aprobación final la hace el administrador. No se envía ningún correo.
      </p>

      {/* Excel */}
      <div className="p-4 overflow-x-auto">
        <table className="border-collapse text-[11px]">
          <thead className="sticky top-[57px] z-10">
            <tr>
              <th className={`${th} sticky left-0 z-10 min-w-[70px]`}>#</th>
              <th className={`${th} min-w-[112px]`}>Estado</th>
              {COLS.map((c) => <th key={c.key} className={`${th} ${c.w}`}>{c.label}</th>)}
              <th className={`${th} sticky right-0 z-10 min-w-[150px] text-center`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const editing = editId === r.id;
              return (
                <tr key={r.id} className={`${editing ? "bg-amber-50" : r.pre_aprobado ? "bg-green-50/40" : "bg-white"} hover:bg-gray-50`}>
                  <td className={`${td} sticky left-0 z-10 bg-inherit text-gray-400 tabular-nums`}>{i + 1}</td>
                  <td className={td}>
                    {r.pre_aprobado
                      ? <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 rounded-full px-2 py-0.5 font-medium"><Check className="w-3 h-3" />Pre-aprobado</span>
                      : <span className="inline-flex items-center text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 font-medium">Por revisar</span>}
                  </td>

                  {COLS.map((c) => (
                    <td key={c.key} className={td}>
                      {editing && c.editable ? (
                        c.select ? (
                          <select value={String(form[c.key] ?? "")} onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))} className={inp}>
                            {c.select.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input value={String(form[c.key] ?? "")} onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))} className={inp} />
                        )
                      ) : c.key === "beneficiarios" ? (
                        r.beneficiarios?.length
                          ? <div className="space-y-0.5">{r.beneficiarios.map((b, bi) => <div key={bi} className="text-gray-600">{b.nombre}{b.parentesco ? ` · ${b.parentesco}` : ""}{b.edad ? ` · ${b.edad}` : ""}</div>)}</div>
                          : <span className="text-gray-300">—</span>
                      ) : (
                        <span className={c.key === "notas" ? "text-gray-500" : ""}>{String(r[c.key] ?? "") || <span className="text-gray-300">—</span>}</span>
                      )}
                    </td>
                  ))}

                  <td className={`${td} sticky right-0 z-10 bg-inherit`}>
                    {editing ? (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={saveEdit} disabled={saving} className="text-green-700 bg-green-100 hover:bg-green-200 rounded px-2 py-1 font-medium flex items-center gap-1 disabled:opacity-50">
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Guardar
                        </button>
                        <button onClick={cancelEdit} className="text-gray-500 hover:bg-gray-100 rounded px-1.5 py-1"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        {!r.pre_aprobado ? (
                          <button onClick={() => preAprobar(r.id)} disabled={saving} className="text-green-700 bg-green-100 hover:bg-green-200 rounded px-2 py-1 font-medium flex items-center gap-1 disabled:opacity-50">
                            <Check className="w-3 h-3" /> Pre-aprobar
                          </button>
                        ) : (
                          <button onClick={() => quitarPre(r.id)} disabled={saving} className="text-gray-500 hover:bg-gray-100 rounded px-1.5 py-1 flex items-center gap-1" title="Quitar pre-aprobación">
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => startEdit(r)} className="text-gray-600 hover:bg-gray-100 rounded px-1.5 py-1 flex items-center gap-1" title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td className={`${td} text-center text-gray-400 py-6`} colSpan={COLS.length + 3}>Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
