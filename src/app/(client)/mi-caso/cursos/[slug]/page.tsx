"use client";

import { useState, useEffect, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientStore } from "@/lib/stores/client-store";
import {
  getCourseBySlug, getModules, getEnrollment, getCompletedLessons,
  completeLesson, uncompleteLesson, issueCertificate, getMyCertificates,
  submitQuizAttempt, getReviews, createReview, getAvgRating,
} from "@/lib/stores/courses-store";
import type { Lesson, Quiz, CourseModule } from "@/lib/stores/courses-store";
import Link from "next/link";
import {
  ArrowLeft, Play, CheckCircle, Lock, ChevronDown, ChevronRight,
  Download, HelpCircle, Award, Star, Send, Clock, BookOpen, User,
  CirclePlay, FileDown, X,
} from "lucide-react";
import { toast } from "sonner";

export default function CourseViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const session = useClientStore((s) => s.session);
  const queryClient = useQueryClient();

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
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

  // Auto-expand first module and select first lesson
  useEffect(() => {
    if (modules && modules.length > 0 && !activeLesson && enrollment) {
      const firstMod = modules[0];
      setExpandedModule(firstMod.id);
      // Find first incomplete lesson or first lesson
      const allLessons = modules.flatMap((m) => m.lessons || []);
      const nextLesson = allLessons.find((l) => !completedIds.has(l.id)) || allLessons[0];
      if (nextLesson) {
        setActiveLesson(nextLesson);
        const parentMod = modules.find((m) => m.lessons?.some((l) => l.id === nextLesson.id));
        if (parentMod) { setExpandedModule(parentMod.id); setActiveModule(parentMod); }
      }
    }
  }, [modules, enrollment]);

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

  const handleCompleteLesson = (lesson: Lesson) => {
    if (lesson.quiz && !completedIds.has(lesson.id)) { setQuizMode(true); setQuizAnswers({}); setQuizResult(null); return; }
    if (completedIds.has(lesson.id)) {
      uncompleteMutation.mutate(lesson.id);
    } else {
      completeMutation.mutate(lesson.id, {
        onSuccess: () => {
          if (!modules || !activeModule) return;

          // Verificar si se completó el módulo actual (incluyendo la lección que acabamos de completar)
          const modLessons = activeModule.lessons || [];
          const modCompletedAfter = modLessons.filter((l) => completedIds.has(l.id) || l.id === lesson.id).length;
          const moduleJustCompleted = modCompletedAfter === modLessons.length;

          // Buscar siguiente lección en el MISMO módulo
          const currentModIndex = modLessons.findIndex((l) => l.id === lesson.id);
          const nextInModule = modLessons.find((l, i) => i > currentModIndex && !completedIds.has(l.id) && l.id !== lesson.id);

          if (nextInModule) {
            // Hay lecciones pendientes en este módulo → ir a la siguiente incompleta
            setTimeout(() => selectLesson(nextInModule, activeModule), 400);
          } else if (moduleJustCompleted) {
            // Módulo completo → buscar primer lección del siguiente módulo
            const modIndex = modules.findIndex((m) => m.id === activeModule.id);
            const nextModule = modules[modIndex + 1];

            if (nextModule && nextModule.lessons && nextModule.lessons.length > 0) {
              toast(
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎉</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">¡Módulo completado!</p>
                    <p className="text-gray-500 text-xs mt-0.5"><strong>{activeModule.title}</strong> — Avanzando al siguiente módulo</p>
                  </div>
                </div>,
                { duration: 3500, style: { padding: "16px", maxWidth: "400px" } }
              );
              setTimeout(() => {
                setExpandedModule(nextModule.id);
                selectLesson(nextModule.lessons![0], nextModule);
              }, 800);
            } else {
              // No hay más módulos
              toast(
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-oro/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🏆</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">¡Curso completado!</p>
                    <p className="text-gray-500 text-xs mt-0.5">Felicitaciones, completaste todas las lecciones. Tu certificado será emitido.</p>
                  </div>
                </div>,
                { duration: 5000, style: { padding: "16px", maxWidth: "400px" } }
              );
            }
          } else {
            // Hay lecciones incompletas en el módulo pero ya completamos la actual
            // Buscar la primera incompleta del módulo
            const firstIncomplete = modLessons.find((l) => !completedIds.has(l.id) && l.id !== lesson.id);
            if (firstIncomplete) {
              const pendingCount = modLessons.filter((l) => !completedIds.has(l.id) && l.id !== lesson.id).length;
              toast(
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📋</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Te faltan {pendingCount} {pendingCount === 1 ? "lección" : "lecciones"}</p>
                    <p className="text-gray-500 text-xs mt-0.5">Completa todas las lecciones de <strong>{activeModule.title}</strong> para avanzar al siguiente módulo</p>
                  </div>
                </div>,
                { duration: 4000, style: { padding: "16px", maxWidth: "400px" } }
              );
              setTimeout(() => selectLesson(firstIncomplete, activeModule), 400);
            }
          }
        },
      });
    }
  };

  const selectLesson = (lesson: Lesson, mod: CourseModule) => {
    setActiveLesson(lesson);
    setActiveModule(mod);
    setQuizMode(false); setQuizResult(null); setQuizAnswers({});
    setShowSidebar(false);
  };

  // Find next lesson
  const getNextLesson = (): { lesson: Lesson; mod: CourseModule } | null => {
    if (!modules || !activeLesson) return null;
    const allLessons = modules.flatMap((m) => (m.lessons || []).map((l) => ({ lesson: l, mod: m })));
    const idx = allLessons.findIndex((x) => x.lesson.id === activeLesson.id);
    return idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
  };

  if (progress === 100 && !hasCertificate && enrollment && !certMutation.isPending && !certMutation.isSuccess) {
    certMutation.mutate();
  }

  if (!course) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-jungle-dark/30 border-t-jungle-dark rounded-full animate-spin" /></div>;
  }

  // ── No enrollment: course overview ──
  if (!enrollment) {
    return (
      <div className="space-y-4">
        <Link href="/mi-caso/cursos" className="inline-flex items-center gap-1.5 text-gray-400 text-xs hover:text-jungle-dark transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Mis cursos
        </Link>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {course.thumbnail_url ? (
            <div className="relative h-40"><img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><h1 className="absolute bottom-4 left-4 right-4 text-white font-bold text-lg">{course.title}</h1></div>
          ) : (
            <div className="bg-gradient-to-r from-jungle-dark to-jungle p-5"><h1 className="text-white font-bold text-lg">{course.title}</h1></div>
          )}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {course.instructor_name && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{course.instructor_name}</span>}
              {totalLessons > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{totalLessons} lecciones</span>}
            </div>
            {course.description && <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>}
            <p className="text-gray-400 text-xs">Inscríbete desde la lista de cursos para acceder al contenido.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Enrolled: learning experience ──
  return (
    <div>
      {/* ── Top bar ── */}
      <div className="bg-jungle-dark px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/mi-caso/cursos" className="text-beige/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-sm truncate">{course.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
                <div className="h-full bg-oro rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-beige/50 text-[10px]">{progress}%</span>
            </div>
          </div>
          <button onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden text-beige/50 hover:text-white p-1.5 transition-colors">
            <BookOpen className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex min-h-[70vh]">
        {/* ── Left: Video + Lesson content ── */}
        <div className="flex-1 min-w-0">
          {activeLesson ? (
            <div>
              {/* Video */}
              {activeLesson.video_url && enrollment ? (
                <div className="aspect-video bg-black relative overflow-hidden">
                  {activeLesson.video_url.includes("youtube") || activeLesson.video_url.includes("youtu.be") ? (
                    <>
                      <iframe
                        src={`${activeLesson.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}?rel=0&modestbranding=1&iv_load_policy=3`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div className="absolute bottom-0 right-0 w-32 h-10 z-10" />
                      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />
                    </>
                  ) : activeLesson.video_url.includes("vimeo") ? (
                    <iframe
                      src={`${activeLesson.video_url.replace("vimeo.com/", "player.vimeo.com/video/")}?title=0&byline=0&portrait=0`}
                      className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
                  ) : (
                    <video src={activeLesson.video_url} controls className="w-full h-full" controlsList="nodownload" />
                  )}
                </div>
              ) : !activeLesson.video_url && enrollment ? (
                <div className="bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center py-10">
                  <div className="text-center">
                    <CirclePlay className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Sin video en esta lección</p>
                  </div>
                </div>
              ) : null}

              {/* Lesson content */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Title + complete */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">
                      {activeModule?.title}
                    </p>
                    <h2 className="text-gray-900 font-bold text-base sm:text-lg">{activeLesson.title}</h2>
                  </div>
                  <button
                    onClick={() => handleCompleteLesson(activeLesson)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex-shrink-0 active:scale-95 ${
                      completedIds.has(activeLesson.id)
                        ? "bg-green-100 text-green-700"
                        : "bg-jungle-dark text-white hover:bg-jungle"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {completedIds.has(activeLesson.id) ? "Completada" : "Completar"}
                  </button>
                </div>

                {activeLesson.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">{activeLesson.description}</p>
                )}

                {/* Actions row */}
                <div className="flex flex-wrap gap-2">
                  {activeLesson.materials_url && (
                    <a href={activeLesson.materials_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                      <FileDown className="w-3.5 h-3.5" /> Material de apoyo
                    </a>
                  )}
                  {activeLesson.quiz && !quizMode && !completedIds.has(activeLesson.id) && (
                    <button onClick={() => { setQuizMode(true); setQuizAnswers({}); setQuizResult(null); }}
                      className="inline-flex items-center gap-2 text-xs font-medium text-purple-600 bg-purple-50 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors">
                      <HelpCircle className="w-3.5 h-3.5" /> Tomar quiz
                    </button>
                  )}
                </div>

                {/* Quiz */}
                {activeLesson.quiz && quizMode && activeLesson.quiz.questions && (
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-purple-600" />
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
                            <label key={oi} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${
                              quizAnswers[q.id] === oi ? "border-purple-300 bg-purple-50 text-purple-700" : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                            } ${quizResult ? oi === q.correct_option_index ? "!border-green-300 !bg-green-50 !text-green-700" : quizAnswers[q.id] === oi ? "!border-red-300 !bg-red-50 !text-red-600" : "" : ""}`}>
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
                        disabled={Object.keys(quizAnswers).length < activeLesson.quiz.questions!.length}
                        className="w-full bg-purple-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-40">
                        Enviar respuestas
                      </button>
                    ) : (
                      <div className={`p-4 rounded-xl text-sm font-medium ${quizResult.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {quizResult.passed ? `¡Aprobaste con ${quizResult.score}%!` : `${quizResult.score}% — necesitas ${activeLesson.quiz.passing_score}%.`}
                        {!quizResult.passed && <button onClick={() => { setQuizResult(null); setQuizAnswers({}); }} className="block mt-2 text-xs underline">Reintentar</button>}
                        {quizResult.passed && !completedIds.has(activeLesson.id) && <button onClick={() => completeMutation.mutate(activeLesson.id)} className="block mt-2 text-xs underline">Marcar como completada</button>}
                      </div>
                    )}
                  </div>
                )}

                {/* Next lesson */}
                {completedIds.has(activeLesson.id) && (() => {
                  const next = getNextLesson();
                  if (!next) return null;
                  return (
                    <button onClick={() => selectLesson(next.lesson, next.mod)}
                      className="w-full flex items-center justify-between bg-jungle-dark/5 hover:bg-jungle-dark/10 rounded-xl p-4 transition-colors group">
                      <div className="text-left">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Siguiente lección</p>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-jungle-dark transition-colors">{next.lesson.title}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-jungle-dark transition-colors" />
                    </button>
                  );
                })()}

                {/* Certificate */}
                {hasCertificate && (
                  <div className="flex items-center gap-3 bg-oro/10 rounded-xl p-4">
                    <Award className="w-7 h-7 text-oro flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">¡Curso completado!</p>
                      <p className="text-xs text-gray-500">Tu certificado ha sido emitido</p>
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {progress > 0 && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
                      <Star className="w-4 h-4 text-oro" /> Reseñas
                      {avgRating && avgRating.count > 0 && <span className="text-gray-400 text-xs font-normal">{avgRating.avg.toFixed(1)} ({avgRating.count})</span>}
                    </h3>
                    {!reviews?.some((r) => r.suscriptor_id === session?.suscriptor_id) && (
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <p className="text-gray-500 text-xs">¿Qué te parece el curso?</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} onClick={() => setReviewRating(n)} className="p-0.5 active:scale-90 transition-transform">
                              <Star className={`w-5 h-5 transition-colors ${n <= reviewRating ? "text-oro fill-oro" : "text-gray-200"}`} />
                            </button>
                          ))}
                        </div>
                        {reviewRating > 0 && (
                          <div className="flex gap-2">
                            <input type="text" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Comentario (opcional)"
                              className="flex-1 bg-white border border-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-jungle-dark/40" />
                            <button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}
                              className="bg-jungle-dark text-white px-3 py-2 rounded-lg hover:bg-jungle transition-colors active:scale-95">
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {reviews?.map((r) => (
                      <div key={r.id} className="flex gap-2.5">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0">{r.suscriptor_nombre?.[0]}</div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-medium text-gray-700">{r.suscriptor_nombre}</span>
                            <div className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-2.5 h-2.5 ${n <= r.rating ? "text-oro fill-oro" : "text-gray-200"}`} />)}</div>
                          </div>
                          {r.comment && <p className="text-gray-500 text-xs">{r.comment}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20 text-center">
              <div>
                <CirclePlay className="w-14 h-14 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Selecciona una lección para comenzar</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Sidebar (desktop always, mobile toggle) ── */}
        <div className={`
          fixed inset-y-0 right-0 w-72 bg-white border-l border-gray-200 z-50 transform transition-transform duration-300 lg:relative lg:inset-auto lg:w-72 lg:transform-none lg:z-auto lg:flex-shrink-0
          ${showSidebar ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}>
          {/* Mobile close */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900">Contenido</span>
            <button onClick={() => setShowSidebar(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
          </div>

          {/* Course info mini */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-2">
              {course.instructor_avatar ? (
                <img src={course.instructor_avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-jungle-dark/10 flex items-center justify-center"><User className="w-3 h-3 text-jungle-dark/50" /></div>
              )}
              <span className="text-xs text-gray-500">{course.instructor_name || "Instructor"}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
              <span>{completedCount}/{totalLessons} lecciones</span>
              <span className="font-bold text-jungle-dark">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-jungle-dark to-oro rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Modules */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(100vh - 160px)" }}>
            {modules?.map((mod, mi) => {
              const modLessons = mod.lessons || [];
              const modCompleted = modLessons.filter((l) => completedIds.has(l.id)).length;
              const modDone = modCompleted === modLessons.length && modLessons.length > 0;
              const isExpanded = expandedModule === mod.id;

              // Módulo bloqueado si el anterior no está completo
              const prevMod = mi > 0 ? modules[mi - 1] : null;
              const prevModLessons = prevMod?.lessons || [];
              const prevModDone = mi === 0 || (prevModLessons.length > 0 && prevModLessons.every((l) => completedIds.has(l.id)));
              const modLocked = !prevModDone;

              return (
                <div key={mod.id} className={`border-b border-gray-100 last:border-0 ${modLocked ? "opacity-50" : ""}`}>
                  <button onClick={() => {
                    if (modLocked) {
                      toast(
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">🔒</span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">Módulo bloqueado</p>
                            <p className="text-gray-500 text-xs mt-0.5">Completa <strong>{prevMod?.title}</strong> para desbloquear este módulo</p>
                          </div>
                        </div>,
                        { duration: 3000, style: { padding: "16px", maxWidth: "400px" } }
                      );
                      return;
                    }
                    setExpandedModule(isExpanded ? null : mod.id);
                  }}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      modDone ? "bg-green-100 text-green-600" : modLocked ? "bg-gray-100 text-gray-300" : "bg-gray-100 text-gray-400"
                    }`}>
                      {modDone ? <CheckCircle className="w-3.5 h-3.5" /> : modLocked ? <Lock className="w-3 h-3" /> : mi + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${modLocked ? "text-gray-400" : "text-gray-800"}`}>{mod.title}</p>
                      <p className="text-[10px] text-gray-400">{modLocked ? "Completa el módulo anterior" : `${modCompleted}/${modLessons.length} lecciones`}</p>
                    </div>
                    {modLocked ? <Lock className="w-3.5 h-3.5 text-gray-300" /> : isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-300" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                  </button>

                  {isExpanded && !modLocked && modLessons.length > 0 && (
                    <div className="pb-1">
                      {modLessons.map((lesson) => {
                        const done = completedIds.has(lesson.id);
                        const active = activeLesson?.id === lesson.id;
                        const canAccess = (!!enrollment || lesson.is_free) && !modLocked;
                        return (
                          <button key={lesson.id}
                            onClick={() => canAccess && selectLesson(lesson, mod)}
                            disabled={!canAccess}
                            className={`flex items-center gap-2.5 w-full pl-12 pr-4 py-2 text-left transition-all text-xs ${
                              active ? "bg-jungle-dark/5 text-jungle-dark font-semibold" : "text-gray-600 hover:bg-gray-50"
                            } ${!canAccess ? "opacity-35 cursor-not-allowed" : ""}`}
                          >
                            {done ? (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : active ? (
                              <Play className="w-4 h-4 text-jungle-dark flex-shrink-0" />
                            ) : !canAccess ? (
                              <Lock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                            )}
                            <span className="flex-1 truncate">{lesson.title}</span>
                            {lesson.quiz && <HelpCircle className="w-3 h-3 text-purple-400 flex-shrink-0" />}
                            {lesson.duration > 0 && <span className="text-gray-400 text-[10px] flex-shrink-0">{lesson.duration}m</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile overlay */}
        {showSidebar && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />}
      </div>
    </div>
  );
}
