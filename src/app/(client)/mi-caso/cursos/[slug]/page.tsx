"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientStore } from "@/lib/stores/client-store";
import {
  getCourseBySlug, getModules, getEnrollment, getCompletedLessons,
  completeLesson, uncompleteLesson, issueCertificate, getMyCertificates,
  submitQuizAttempt, getReviews, createReview, getAvgRating,
} from "@/lib/stores/courses-store";
import type { Lesson, Quiz } from "@/lib/stores/courses-store";
import Link from "next/link";
import {
  ArrowLeft, Play, CheckCircle, Lock, ChevronDown, ChevronRight,
  Download, HelpCircle, Award, Star, Send, Clock, BookOpen, User,
} from "lucide-react";
import { toast } from "sonner";

export default function CourseViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const session = useClientStore((s) => s.session);
  const queryClient = useQueryClient();

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  const { data: course } = useQuery({ queryKey: ["course-slug", slug], queryFn: () => getCourseBySlug(slug) });
  const { data: modules } = useQuery({ queryKey: ["course-modules", course?.id], queryFn: () => getModules(course!.id), enabled: !!course });
  const { data: enrollment } = useQuery({ queryKey: ["enrollment", session?.suscriptor_id, course?.id], queryFn: () => getEnrollment(session!.suscriptor_id, course!.id), enabled: !!session && !!course });
  const { data: completed } = useQuery({ queryKey: ["completed-lessons", enrollment?.id], queryFn: () => getCompletedLessons(enrollment!.id), enabled: !!enrollment });
  const { data: certificates } = useQuery({ queryKey: ["my-certs", session?.suscriptor_id], queryFn: () => getMyCertificates(session!.suscriptor_id), enabled: !!session });
  const { data: reviews } = useQuery({ queryKey: ["reviews", course?.id], queryFn: () => getReviews(course!.id), enabled: !!course });
  const { data: avgRating } = useQuery({ queryKey: ["avg-rating", course?.id], queryFn: () => getAvgRating(course!.id), enabled: !!course });

  const completedIds = new Set(completed?.map((c) => c.lesson_id) || []);
  const totalLessons = modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;
  const completedCount = completedIds.size;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const hasCertificate = certificates?.some((c) => c.course_id === course?.id);
  const totalDuration = modules?.reduce((sum, m) => sum + (m.lessons?.reduce((s, l) => s + l.duration, 0) || 0), 0) || 0;

  const completeMutation = useMutation({
    mutationFn: (lessonId: string) => completeLesson(enrollment!.id, lessonId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["completed-lessons"] }); toast.success("Lección completada"); },
  });
  const uncompleteMutation = useMutation({
    mutationFn: (lessonId: string) => uncompleteLesson(enrollment!.id, lessonId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["completed-lessons"] }); },
  });
  const certMutation = useMutation({
    mutationFn: () => issueCertificate(session!.suscriptor_id, course!.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["my-certs"] }); toast.success("¡Certificado emitido!"); },
    onError: (err: Error) => toast.error(err.message),
  });
  const reviewMutation = useMutation({
    mutationFn: () => createReview(session!.suscriptor_id, course!.id, reviewRating, reviewComment || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", course?.id] });
      queryClient.invalidateQueries({ queryKey: ["avg-rating", course?.id] });
      setReviewRating(0); setReviewComment("");
      toast.success("¡Gracias por tu reseña!");
    },
    onError: (err: Error) => toast.error(err.message?.includes("duplicate") ? "Ya dejaste una reseña" : err.message),
  });

  const handleQuizSubmit = async (quiz: Quiz) => {
    if (!quiz.questions) return;
    let correct = 0;
    for (const q of quiz.questions) { if (quizAnswers[q.id] === q.correct_option_index) correct++; }
    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passing_score;
    setQuizResult({ score, passed });
    await submitQuizAttempt(session!.suscriptor_id, quiz.id, score, quizAnswers);
    toast[passed ? "success" : "error"](passed ? `¡Aprobaste con ${score}%!` : `${score}% — necesitas ${quiz.passing_score}%`);
  };

  const handleCompleteLesson = async (lesson: Lesson) => {
    if (lesson.quiz && !completedIds.has(lesson.id)) { setQuizMode(true); setQuizAnswers({}); setQuizResult(null); return; }
    completedIds.has(lesson.id) ? uncompleteMutation.mutate(lesson.id) : completeMutation.mutate(lesson.id);
  };

  if (progress === 100 && !hasCertificate && enrollment && !certMutation.isPending && !certMutation.isSuccess) {
    certMutation.mutate();
  }

  if (!course) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-jungle-dark/30 border-t-jungle-dark rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 -mx-4 sm:mx-0">
      {/* Back */}
      <div className="px-4 sm:px-0">
        <Link href="/mi-caso/cursos" className="inline-flex items-center gap-1.5 text-gray-400 text-xs hover:text-jungle-dark transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Mis cursos
        </Link>
      </div>

      {/* ── Course Hero ── */}
      <div className="bg-white rounded-none sm:rounded-2xl border-y sm:border border-gray-200 overflow-hidden">
        {/* Thumbnail / gradient header */}
        {course.thumbnail_url ? (
          <div className="relative h-40 sm:h-48">
            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
              <h1 className="text-white font-bold text-lg sm:text-xl leading-tight">{course.title}</h1>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-jungle-dark to-jungle p-5 sm:p-6">
            <h1 className="text-white font-bold text-lg sm:text-xl">{course.title}</h1>
          </div>
        )}

        <div className="p-4 sm:p-5 space-y-4">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {course.instructor_name && (
              <span className="flex items-center gap-1.5">
                {course.instructor_avatar ? (
                  <img src={course.instructor_avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                {course.instructor_name}
              </span>
            )}
            {totalLessons > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {totalLessons} lecciones</span>}
            {totalDuration > 0 && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.round(totalDuration / 60)}h</span>}
            {avgRating && avgRating.count > 0 && (
              <span className="flex items-center gap-1 text-oro font-semibold">
                <Star className="w-3.5 h-3.5 fill-oro" /> {avgRating.avg.toFixed(1)} <span className="text-gray-400 font-normal">({avgRating.count})</span>
              </span>
            )}
          </div>

          {course.description && <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>}

          {/* Progress */}
          {enrollment && (
            <div className="bg-gray-50 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">Tu progreso</span>
                <span className="text-xs font-bold text-jungle-dark">{completedCount}/{totalLessons} · {progress}%</span>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-jungle-dark to-oro rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Certificate */}
          {hasCertificate && (
            <div className="flex items-center gap-3 bg-oro/10 rounded-xl p-3.5">
              <Award className="w-6 h-6 text-oro flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">¡Curso completado!</p>
                <p className="text-xs text-gray-500">Tu certificado ha sido emitido</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Active Lesson Viewer ── */}
      {activeLesson && enrollment && (
        <div className="bg-white rounded-none sm:rounded-2xl border-y sm:border border-gray-200 overflow-hidden">
          {/* Video */}
          {activeLesson.video_url && (
            <div className="aspect-video bg-black">
              {activeLesson.video_url.includes("youtube") || activeLesson.video_url.includes("youtu.be") ? (
                <iframe src={activeLesson.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : activeLesson.video_url.includes("vimeo") ? (
                <iframe src={activeLesson.video_url.replace("vimeo.com/", "player.vimeo.com/video/")} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
              ) : (
                <video src={activeLesson.video_url} controls className="w-full h-full" />
              )}
            </div>
          )}

          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-gray-900 font-bold text-base">{activeLesson.title}</h3>
                {activeLesson.description && <p className="text-gray-500 text-sm mt-1">{activeLesson.description}</p>}
              </div>
              <button
                onClick={() => handleCompleteLesson(activeLesson)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex-shrink-0 ${
                  completedIds.has(activeLesson.id)
                    ? "bg-green-100 text-green-700"
                    : "bg-jungle-dark text-white hover:bg-jungle active:scale-95"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {completedIds.has(activeLesson.id) ? "Completada" : "Completar"}
              </button>
            </div>

            {activeLesson.materials_url && (
              <a href={activeLesson.materials_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                <Download className="w-3.5 h-3.5" /> Descargar material
              </a>
            )}

            {/* Quiz */}
            {activeLesson.quiz && quizMode && activeLesson.quiz.questions && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{activeLesson.quiz.title}</p>
                    <p className="text-xs text-gray-400">Mínimo {activeLesson.quiz.passing_score}% para aprobar</p>
                  </div>
                </div>
                {activeLesson.quiz.questions.map((q, qi) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm text-gray-800 font-medium">{qi + 1}. {q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <label key={oi}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${
                            quizAnswers[q.id] === oi
                              ? "border-purple-300 bg-purple-50 text-purple-700"
                              : "border-gray-100 hover:bg-gray-50 text-gray-600"
                          } ${quizResult
                            ? oi === q.correct_option_index
                              ? "!border-green-300 !bg-green-50 !text-green-700"
                              : quizAnswers[q.id] === oi ? "!border-red-300 !bg-red-50 !text-red-600" : ""
                            : ""
                          }`}
                        >
                          <input type="radio" name={`q-${q.id}`} checked={quizAnswers[q.id] === oi}
                            onChange={() => !quizResult && setQuizAnswers({ ...quizAnswers, [q.id]: oi })}
                            disabled={!!quizResult} className="accent-purple-600" />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {!quizResult ? (
                  <button onClick={() => handleQuizSubmit(activeLesson.quiz!)}
                    disabled={Object.keys(quizAnswers).length < activeLesson.quiz.questions.length}
                    className="w-full bg-purple-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-40">
                    Enviar respuestas
                  </button>
                ) : (
                  <div className={`p-4 rounded-xl text-sm font-medium ${quizResult.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {quizResult.passed
                      ? `¡Aprobaste con ${quizResult.score}%!`
                      : `${quizResult.score}% — necesitas ${activeLesson.quiz.passing_score}%.`}
                    {!quizResult.passed && (
                      <button onClick={() => { setQuizResult(null); setQuizAnswers({}); }} className="block mt-2 text-xs underline">Reintentar</button>
                    )}
                    {quizResult.passed && !completedIds.has(activeLesson.id) && (
                      <button onClick={() => completeMutation.mutate(activeLesson.id)} className="block mt-2 text-xs underline">Marcar como completada</button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeLesson.quiz && !quizMode && !completedIds.has(activeLesson.id) && (
              <button onClick={() => { setQuizMode(true); setQuizAnswers({}); setQuizResult(null); }}
                className="flex items-center gap-2 text-xs font-medium text-purple-600 bg-purple-50 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors">
                <HelpCircle className="w-3.5 h-3.5" /> Tomar quiz para completar esta lección
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Modules & Lessons ── */}
      <div className="space-y-2 px-4 sm:px-0">
        <h2 className="text-gray-900 font-bold text-sm mb-1">Contenido del curso</h2>
        {modules?.map((mod, mi) => {
          const modLessons = mod.lessons || [];
          const modCompleted = modLessons.filter((l) => completedIds.has(l.id)).length;
          const modDone = modCompleted === modLessons.length && modLessons.length > 0;
          const isExpanded = expandedModule === mod.id;

          return (
            <div key={mod.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  modDone ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                }`}>
                  {modDone ? <CheckCircle className="w-4 h-4" /> : mi + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-semibold truncate">{mod.title}</p>
                  {mod.description && <p className="text-gray-400 text-xs truncate mt-0.5">{mod.description}</p>}
                </div>
                <span className="text-gray-400 text-xs flex-shrink-0 mr-1">{modCompleted}/{modLessons.length}</span>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
              </button>

              {isExpanded && modLessons.length > 0 && (
                <div className="border-t border-gray-100">
                  {modLessons.map((lesson, li) => {
                    const isCompleted = completedIds.has(lesson.id);
                    const isActive = activeLesson?.id === lesson.id;
                    const canAccess = enrollment || lesson.is_free;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          if (!canAccess) return;
                          setActiveLesson(lesson);
                          setQuizMode(false); setQuizResult(null); setQuizAnswers({});
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        disabled={!canAccess}
                        className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-all ${
                          isActive ? "bg-jungle-dark/5 border-l-2 border-l-jungle-dark" : "hover:bg-gray-50 border-l-2 border-l-transparent"
                        } ${!canAccess ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {/* Status icon */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? "bg-green-100" : isActive ? "bg-jungle-dark/10" : "bg-gray-50"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          ) : !canAccess ? (
                            <Lock className="w-3 h-3 text-gray-300" />
                          ) : (
                            <Play className="w-3 h-3 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isActive ? "text-jungle-dark font-semibold" : isCompleted ? "text-gray-500" : "text-gray-700"}`}>
                            {lesson.title}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {lesson.is_free && !enrollment && (
                            <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">GRATIS</span>
                          )}
                          {lesson.quiz && <HelpCircle className="w-3 h-3 text-purple-400" />}
                          {lesson.duration > 0 && <span className="text-gray-400 text-[11px]">{lesson.duration}min</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Reviews ── */}
      {enrollment && (
        <div className="bg-white rounded-none sm:rounded-2xl border-y sm:border border-gray-200 p-4 sm:p-5 space-y-4">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-oro" /> Reseñas
          </h3>

          {/* Leave review */}
          {!reviews?.some((r) => r.suscriptor_id === session?.suscriptor_id) && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-gray-600 text-xs font-medium">¿Qué te pareció el curso?</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setReviewRating(n)} className="p-1 active:scale-90 transition-transform">
                    <Star className={`w-6 h-6 transition-colors ${n <= reviewRating ? "text-oro fill-oro" : "text-gray-200"}`} />
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <div className="flex gap-2">
                  <input type="text" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Comentario (opcional)"
                    className="flex-1 bg-white border border-gray-200 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-jungle-dark/40" />
                  <button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}
                    className="bg-jungle-dark text-white px-4 py-2.5 rounded-xl hover:bg-jungle transition-colors active:scale-95">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reviews list */}
          <div className="space-y-3">
            {reviews?.map((r) => (
              <div key={r.id} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                  {r.suscriptor_nombre?.[0] || "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-800">{r.suscriptor_nombre}</span>
                    <div className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3 h-3 ${n <= r.rating ? "text-oro fill-oro" : "text-gray-200"}`} />)}</div>
                  </div>
                  {r.comment && <p className="text-gray-500 text-xs leading-relaxed">{r.comment}</p>}
                </div>
              </div>
            ))}
            {reviews?.length === 0 && <p className="text-gray-400 text-xs text-center py-2">Sé el primero en dejar una reseña</p>}
          </div>
        </div>
      )}
    </div>
  );
}
