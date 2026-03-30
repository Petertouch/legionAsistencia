"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientStore } from "@/lib/stores/client-store";
import { getPublishedCourses, getMyEnrollments, enrollInCourse } from "@/lib/stores/courses-store";
import type { Course } from "@/lib/stores/courses-store";
import Link from "next/link";
import { GraduationCap, Clock, Lock, CheckCircle, BookOpen, Search, ArrowRight, User } from "lucide-react";
import { toast } from "sonner";

export default function CursosClientePage() {
  const session = useClientStore((s) => s.session);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["published-courses"],
    queryFn: getPublishedCourses,
  });

  const { data: enrollments } = useQuery({
    queryKey: ["my-enrollments", session?.suscriptor_id],
    queryFn: () => getMyEnrollments(session!.suscriptor_id),
    enabled: !!session,
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => enrollInCourse(session!.suscriptor_id, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      toast.success("¡Inscrito exitosamente!");
    },
    onError: (err: Error) => {
      if (err.message?.includes("duplicate")) toast.error("Ya estás inscrito");
      else toast.error(err.message);
    },
  });

  const enrolledCourseIds = new Set(enrollments?.map((e) => e.course_id) || []);

  const formatPrice = (price: number) =>
    price === 0 ? "Gratis" : `$${price.toLocaleString("es-CO")}`;

  const handleEnroll = (course: Course) => {
    if (course.price > 0) { toast.error("Curso de pago — pronto habilitaremos pagos"); return; }
    enrollMutation.mutate(course.id);
  };

  // Separate enrolled vs available
  const allCourses = courses || [];
  const misCursos = allCourses.filter((c) => enrolledCourseIds.has(c.id));
  const disponibles = allCourses.filter((c) => !enrolledCourseIds.has(c.id));

  const filteredDisponibles = search
    ? disponibles.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()))
    : disponibles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 font-bold text-xl">Cursos</h1>
        <p className="text-gray-500 text-sm mt-0.5">Formación financiera diseñada para ti</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-jungle-dark/30 border-t-jungle-dark rounded-full animate-spin" />
        </div>
      )}

      {/* ── Mis cursos en progreso ── */}
      {misCursos.length > 0 && (
        <div>
          <h2 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-jungle-dark" /> Continúa aprendiendo
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
            {misCursos.map((course) => (
              <Link key={course.id} href={`/mi-caso/cursos/${course.slug}`}
                className="flex-shrink-0 w-64 sm:w-72 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all snap-start group">
                <div className="relative h-32 bg-gray-100">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-jungle-dark to-jungle flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-semibold text-sm line-clamp-2 leading-tight">{course.title}</p>
                  </div>
                  {/* Badge inscrito */}
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" /> Inscrito
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    {course.instructor_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{course.instructor_name}</span>}
                    {course.total_hours > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.total_hours}h</span>}
                  </div>
                  <span className="text-jungle-dark text-xs font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                    Continuar <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Cursos disponibles ── */}
      {disponibles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-900 font-bold text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-gray-400" /> Todos los cursos
              <span className="text-gray-400 font-normal">({disponibles.length})</span>
            </h2>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cursos..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm pl-10 pr-4 py-2.5 rounded-xl placeholder-gray-400 focus:outline-none focus:border-jungle-dark/40" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredDisponibles.map((course) => (
              <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
                {/* Thumbnail */}
                <div className="relative h-36 bg-gray-100">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-jungle-dark to-jungle flex items-center justify-center">
                      <GraduationCap className="w-10 h-10 text-white/15" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {/* Price badge */}
                  <div className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    course.price === 0
                      ? "bg-green-500 text-white"
                      : "bg-oro text-jungle-dark"
                  }`}>
                    {formatPrice(course.price)}
                  </div>
                  {/* Duration */}
                  {course.total_hours > 0 && (
                    <div className="absolute top-2.5 right-2.5 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                      <Clock className="w-3 h-3" /> {course.total_hours}h
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3.5">
                  <h3 className="text-gray-900 font-bold text-sm line-clamp-2 leading-snug mb-1.5">{course.title}</h3>

                  {course.description && (
                    <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-3">{course.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      {course.instructor_avatar ? (
                        <img src={course.instructor_avatar} className="w-4 h-4 rounded-full object-cover" alt="" />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                      {course.instructor_name || "Instructor"}
                    </div>
                    <button onClick={() => handleEnroll(course)} disabled={enrollMutation.isPending}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-jungle-dark px-3.5 py-1.5 rounded-lg hover:bg-jungle transition-colors active:scale-95 disabled:opacity-50">
                      {course.price > 0 ? <Lock className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                      Inscribirme
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDisponibles.length === 0 && search && (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No se encontraron cursos para "{search}"</p>
            </div>
          )}
        </div>
      )}

      {!isLoading && allCourses.length === 0 && (
        <div className="text-center py-16">
          <GraduationCap className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Próximamente nuevos cursos</p>
          <p className="text-gray-400 text-xs mt-1">Estamos preparando contenido para ti</p>
        </div>
      )}
    </div>
  );
}
