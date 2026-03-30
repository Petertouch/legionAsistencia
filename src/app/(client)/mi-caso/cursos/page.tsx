"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientStore } from "@/lib/stores/client-store";
import { getPublishedCourses, getMyEnrollments, enrollInCourse } from "@/lib/stores/courses-store";
import type { Course } from "@/lib/stores/courses-store";
import Link from "next/link";
import { GraduationCap, Clock, Star, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function CursosClientePage() {
  const session = useClientStore((s) => s.session);
  const queryClient = useQueryClient();

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
      if (err.message?.includes("duplicate")) toast.error("Ya estás inscrito en este curso");
      else toast.error(err.message);
    },
  });

  const enrolledCourseIds = new Set(enrollments?.map((e) => e.course_id) || []);

  const formatPrice = (price: number) =>
    price === 0 ? "Gratis" : `$${price.toLocaleString("es-CO")}`;

  const handleEnroll = (course: Course) => {
    if (course.price > 0) {
      toast.error("Curso de pago — pronto habilitaremos pagos en línea");
      return;
    }
    enrollMutation.mutate(course.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-jungle-dark" />
        <h1 className="text-jungle-dark font-bold text-lg">Cursos disponibles</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-jungle-dark/30 border-t-jungle-dark rounded-full animate-spin" />
        </div>
      )}

      <div className="grid gap-3">
        {courses?.map((course) => {
          const isEnrolled = enrolledCourseIds.has(course.id);
          return (
            <div
              key={course.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {course.thumbnail_url && (
                <div className="h-36 bg-gray-100 overflow-hidden">
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-jungle-dark font-bold text-sm line-clamp-2">{course.title}</h3>
                    {course.instructor_name && (
                      <p className="text-gray-500 text-xs mt-0.5">{course.instructor_name}</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                    course.price === 0
                      ? "bg-green-100 text-green-700"
                      : "bg-oro/20 text-oro-dark"
                  }`}>
                    {formatPrice(course.price)}
                  </span>
                </div>

                {course.description && (
                  <p className="text-gray-600 text-xs line-clamp-2">{course.description}</p>
                )}

                <div className="flex items-center gap-3 text-gray-400 text-xs">
                  {course.total_hours > 0 && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.total_hours}h</span>
                  )}
                  {course.category && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{course.category.name}</span>
                  )}
                </div>

                <div className="pt-2">
                  {isEnrolled ? (
                    <Link
                      href={`/mi-caso/cursos/${course.slug}`}
                      className="flex items-center justify-center gap-2 w-full bg-jungle-dark text-white text-sm font-medium py-2.5 rounded-lg hover:bg-jungle transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Continuar curso
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course)}
                      disabled={enrollMutation.isPending}
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-oro to-oro-light text-jungle-dark text-sm font-bold py-2.5 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {course.price > 0 && <Lock className="w-3.5 h-3.5" />}
                      {course.price === 0 ? "Inscribirme gratis" : "Inscribirme"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && courses?.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Próximamente nuevos cursos</p>
        </div>
      )}
    </div>
  );
}
