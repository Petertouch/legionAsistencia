"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCourse, getCategories, createCategory } from "@/lib/stores/courses-store";
import { useTeamStore } from "@/lib/stores/team-store";
import Button from "@/components/ui/button";
import {
  ArrowLeft, ArrowRight, GraduationCap, User, Tag, DollarSign,
  Plus, Check, Upload, Loader2, X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Step = 1 | 2 | 3;

const STEPS = [
  { num: 1, label: "Información" },
  { num: 2, label: "Profesor" },
  { num: 3, label: "Confirmar" },
];

export default function NuevoCursoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(1);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [profesorId, setProfesorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Category
  const [newCategory, setNewCategory] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  const allMembers = useTeamStore((s) => s.abogados);
  const profesores = useMemo(() => allMembers.filter((a) => a.role === "profesor"), [allMembers]);
  const selectedProfesor = profesores.find((p) => p.id === profesorId);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  const createMutation = useMutation({
    mutationFn: () =>
      createCourse({
        title,
        description,
        price: parseFloat(price) || 0,
        instructor_name: selectedProfesor?.nombre || undefined,
        instructor_bio: selectedProfesor?.especialidad_academica || undefined,
        instructor_avatar: selectedProfesor?.avatar_url || undefined,
        category_id: categoryId || null,
        thumbnail_url: thumbnailUrl || null,
      }),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Curso creado exitosamente");
      router.push(`/admin/cursos/${course.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createCatMutation = useMutation({
    mutationFn: () => createCategory(newCategory),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCategoryId(cat.id);
      setNewCategory("");
      setShowNewCat(false);
      toast.success("Categoría creada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setThumbnailUrl(data.url);
      toast.success("Imagen subida");
    } catch { toast.error("Error subiendo imagen"); }
    finally { setUploading(false); }
  };

  const canNext1 = title.trim().length > 0;
  const canCreate = title.trim().length > 0;

  const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40";
  const labelCls = "text-gray-500 text-xs font-medium mb-1.5 block";

  const formatPrice = (p: string) => {
    const n = parseFloat(p) || 0;
    return n === 0 ? "Gratis" : `$${n.toLocaleString("es-CO")}`;
  };

  const selectedCat = categories?.find((c) => c.id === categoryId);

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/cursos" className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-gray-900 text-lg font-bold">Nuevo Curso</h1>
          <p className="text-gray-400 text-xs">Paso {step} de 3</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => s.num < step ? setStep(s.num as Step) : undefined}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                s.num === step
                  ? "bg-oro text-jungle-dark"
                  : s.num < step
                  ? "bg-green-500/20 text-green-600 cursor-pointer hover:bg-green-500/30"
                  : "bg-gray-50 text-gray-300"
              }`}
            >
              {s.num < step ? <Check className="w-4 h-4" /> : s.num}
            </button>
            <span className={`text-xs font-medium hidden sm:block ${
              s.num === step ? "text-gray-900" : s.num < step ? "text-green-600" : "text-gray-300"
            }`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${s.num < step ? "bg-green-500/30" : "bg-gray-100"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ═══ STEP 1: Información ═══ */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Thumbnail */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <label className={labelCls}>Portada del curso</label>
            {thumbnailUrl ? (
              <div className="relative rounded-lg overflow-hidden mt-1">
                <img src={thumbnailUrl} alt="Portada" className="w-full h-40 object-cover" />
                <button onClick={() => setThumbnailUrl("")}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-gray-900 hover:bg-black/80 transition-colors">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center gap-2 py-8 mt-1 border-2 border-dashed border-gray-200 hover:border-oro/30 rounded-xl cursor-pointer transition-colors group ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-oro animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-300 group-hover:text-oro transition-colors" />
                )}
                <span className="text-gray-400 text-xs group-hover:text-gray-500 transition-colors">
                  {uploading ? "Subiendo..." : "Subir imagen de portada (opcional)"}
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} />
              </label>
            )}
          </div>

          {/* Title */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
            <div>
              <label className={labelCls}>Título del curso *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Derecho Disciplinario Militar" className={inputCls} autoFocus />
            </div>

            <div>
              <label className={labelCls}>Descripción</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                placeholder="¿De qué trata este curso? ¿Qué aprenderán los estudiantes?"
                className={`${inputCls} resize-none`} />
            </div>
          </div>

          {/* Category + Price */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
            <div>
              <label className={labelCls}>Categoría</label>
              {!showNewCat ? (
                <div className="flex gap-2">
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputCls} appearance-none flex-1`}>
                    <option value="" className="bg-white">Sin categoría</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-white">{cat.name}</option>
                    ))}
                  </select>
                  <button onClick={() => setShowNewCat(true)}
                    className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-oro hover:border-oro/30 transition-colors" title="Nueva categoría">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nombre de la categoría" className={`${inputCls} flex-1`} autoFocus />
                  <Button size="sm" onClick={() => createCatMutation.mutate()} disabled={!newCategory.trim()}>Crear</Button>
                  <button onClick={() => { setShowNewCat(false); setNewCategory(""); }}
                    className="p-2.5 text-gray-400 hover:text-gray-900 transition-colors">
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>Precio (COP)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="10000"
                  className={`${inputCls} pl-9`} />
              </div>
              <p className="text-gray-300 text-xs mt-1">{formatPrice(price)}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!canNext1}>
              Siguiente <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Profesor ═══ */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <label className={labelCls}>Asignar profesor</label>
            <p className="text-gray-300 text-xs mb-3">Selecciona quién impartirá este curso (opcional)</p>

            {profesores.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <User className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No hay profesores registrados</p>
                <Link href="/admin/profesores/nuevo" className="text-oro text-xs font-medium hover:underline mt-2 inline-block">
                  Crear profesor
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Opción: sin profesor */}
                <button
                  onClick={() => setProfesorId("")}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    !profesorId
                      ? "bg-white border-oro/30"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${!profesorId ? "text-gray-900" : "text-gray-400"}`}>Sin profesor asignado</p>
                    <p className="text-gray-300 text-xs">Se puede asignar después</p>
                  </div>
                  {!profesorId && <Check className="w-4 h-4 text-oro ml-auto" />}
                </button>

                {/* Profesores */}
                {profesores.map((p) => {
                  const selected = profesorId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setProfesorId(p.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? "bg-purple-500/10 border-purple-500/30"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: p.avatar_url ? "transparent" : p.color }}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-900 font-bold text-sm">
                            {p.nombre.split(" ").pop()?.[0] || "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${selected ? "text-gray-900" : "text-gray-500"}`}>{p.nombre}</p>
                        <p className="text-gray-400 text-xs truncate">{p.especialidad_academica || p.email}</p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" /> Atrás
            </Button>
            <Button onClick={() => setStep(3)}>
              Siguiente <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Confirmar ═══ */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
            {/* Preview header */}
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="Portada" className="w-full h-36 object-cover" />
            ) : (
              <div className="w-full h-24 bg-gradient-to-r from-purple-500/20 to-oro/20 flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-gray-900/20" />
              </div>
            )}

            <div className="p-5 space-y-4">
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Título</p>
                <h2 className="text-gray-900 text-lg font-bold">{title}</h2>
              </div>

              {description && (
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Descripción</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Precio</p>
                  <p className={`text-sm font-bold ${parseFloat(price) === 0 ? "text-green-600" : "text-oro"}`}>
                    {formatPrice(price)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Categoría</p>
                  <p className="text-gray-900 text-sm font-medium">{selectedCat?.name || "Sin categoría"}</p>
                </div>
              </div>

              {/* Profesor preview */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">Profesor</p>
                {selectedProfesor ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: selectedProfesor.avatar_url ? "transparent" : selectedProfesor.color }}>
                      {selectedProfesor.avatar_url ? (
                        <img src={selectedProfesor.avatar_url} alt={selectedProfesor.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-900 font-bold text-sm">
                          {selectedProfesor.nombre.split(" ").pop()?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm font-medium">{selectedProfesor.nombre}</p>
                      <p className="text-gray-400 text-xs">{selectedProfesor.especialidad_academica}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Sin profesor asignado</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" /> Atrás
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={!canCreate || createMutation.isPending}>
              {createMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
              ) : (
                <><GraduationCap className="w-4 h-4" /> Crear curso</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
