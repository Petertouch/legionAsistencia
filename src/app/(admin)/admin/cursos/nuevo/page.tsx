"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCourse, getCategories, createCategory } from "@/lib/stores/courses-store";
import Button from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NuevoCursoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [instructorName, setInstructorName] = useState("");
  const [instructorBio, setInstructorBio] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCourse({
        title,
        description,
        price: parseFloat(price) || 0,
        instructor_name: instructorName || undefined,
        instructor_bio: instructorBio || undefined,
        category_id: categoryId || null,
      }),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Curso creado");
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

  const inputCls =
    "w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40";
  const labelCls = "text-beige/60 text-xs font-medium mb-1.5 block";

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/cursos" className="p-2 rounded-lg text-beige/40 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white text-lg font-bold">Nuevo Curso</h1>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 space-y-4">
        <div>
          <label className={labelCls}>Título *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Derecho Disciplinario Militar" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="¿De qué trata este curso?" className={inputCls} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Precio (COP)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="1000" className={inputCls} />
            <p className="text-beige/30 text-xs mt-1">0 = Gratis</p>
          </div>
          <div>
            <label className={labelCls}>Categoría</label>
            {!showNewCat ? (
              <div className="flex gap-2">
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputCls} appearance-none flex-1`}>
                  <option value="" className="bg-jungle-dark">Sin categoría</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-jungle-dark">{cat.name}</option>
                  ))}
                </select>
                <button onClick={() => setShowNewCat(true)} className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-beige/40 hover:text-oro hover:border-oro/30 transition-colors" title="Nueva categoría">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nombre categoría" className={`${inputCls} flex-1`} />
                <Button size="sm" onClick={() => createCatMutation.mutate()} disabled={!newCategory.trim()}>Crear</Button>
                <button onClick={() => setShowNewCat(false)} className="p-2.5 text-beige/40 hover:text-white transition-colors text-sm">✕</button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-beige/50 text-xs font-medium mb-3">Instructor</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre</label>
              <input type="text" value={instructorName} onChange={(e) => setInstructorName(e.target.value)} placeholder="Nombre del instructor" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bio corta</label>
              <input type="text" value={instructorBio} onChange={(e) => setInstructorBio(e.target.value)} placeholder="Ej: Abogado penalista, 10 años" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/cursos">
            <Button variant="ghost">Cancelar</Button>
          </Link>
          <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending}>
            {createMutation.isPending ? "Creando..." : "Crear curso"}
          </Button>
        </div>
      </div>
    </div>
  );
}
