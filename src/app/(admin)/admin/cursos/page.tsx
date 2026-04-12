"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCoursesAdmin, deleteCourse, updateCourse } from "@/lib/stores/courses-store";
import type { Course } from "@/lib/stores/courses-store";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Plus, Search, GraduationCap, Eye, EyeOff, Trash2, Pencil, Users, Star } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  DISABLED: "Deshabilitado",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-yellow-50 text-yellow-600 border-yellow-200",
  PUBLISHED: "bg-green-50 text-green-600 border-green-200",
  DISABLED: "bg-red-100 text-red-600 border-red-200",
};

export default function CursosAdminPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: getCoursesAdmin,
  });

  const toggleMutation = useMutation({
    mutationFn: (course: Course) =>
      updateCourse(course.id, {
        status: course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Estado actualizado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Curso eliminado");
    },
  });

  const filtered = (courses || []).filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.instructor_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const formatPrice = (price: number) =>
    price === 0 ? "Gratis" : `$${price.toLocaleString("es-CO")}`;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <GraduationCap className="w-5 h-5 text-oro" />
          <span className="text-gray-500 text-xs md:text-sm">{filtered.length} cursos</span>
        </div>
        <Link href="/admin/cursos/nuevo">
          <Button size="sm"><Plus className="w-4 h-4" /> Nuevo curso</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar curso o instructor..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm pl-10 pr-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none"
        >
          <option value="" className="bg-white">Todos</option>
          <option value="DRAFT" className="bg-white">Borrador</option>
          <option value="PUBLISHED" className="bg-white">Publicado</option>
          <option value="DISABLED" className="bg-white">Deshabilitado</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-oro/30 border-t-oro rounded-full animate-spin" />
        </div>
      )}

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/admin/cursos/${c.id}`}
            className="block bg-gray-50 border border-gray-200 rounded-xl p-3.5 hover:bg-white transition-colors active:bg-gray-100"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-gray-900 text-sm font-medium line-clamp-1 flex-1">{c.title}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status]}`}>
                {STATUS_LABELS[c.status]}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-500 text-xs">
              <span>{c.instructor_name || "Sin instructor"}</span>
              <span>•</span>
              <span className="text-oro font-medium">{formatPrice(c.price)}</span>
              {c.category && (
                <>
                  <span>•</span>
                  <span>{c.category.name}</span>
                </>
              )}
            </div>
          </Link>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Sin cursos</p>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Curso</th>
                <th className="text-left px-4 py-3 font-medium">Instructor</th>
                <th className="text-left px-4 py-3 font-medium">Precio</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Categoría</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/cursos/${c.id}`}
                      className="text-gray-900 hover:text-oro transition-colors font-medium"
                    >
                      {c.title}
                    </Link>
                    {c.total_hours > 0 && (
                      <p className="text-gray-400 text-xs mt-0.5">{c.total_hours}h</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.instructor_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={c.price === 0 ? "text-green-600 font-medium" : "text-oro font-medium"}>
                      {formatPrice(c.price)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {c.category?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/cursos/${c.id}`}
                        className="p-2 rounded-lg text-gray-400 hover:text-oro hover:bg-gray-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleMutation.mutate(c);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        title={c.status === "PUBLISHED" ? "Despublicar" : "Publicar"}
                      >
                        {c.status === "PUBLISHED" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm("¿Eliminar este curso?")) deleteMutation.mutate(c.id);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Sin cursos</p>
        )}
      </div>
    </div>
  );
}
