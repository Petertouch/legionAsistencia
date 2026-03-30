"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientStore } from "@/lib/stores/client-store";
import {
  getCourseBySlug, getModules, getEnrollment, getCompletedLessons,
  completeLesson, uncompleteLesson, issueCertificate, getMyCertificates,
  submitQuizAttempt, getMyQuizAttempts, getReviews, createReview, getAvgRating,
} from "@/lib/stores/courses-store";
import type { Lesson, Quiz, QuizQuestion, CompletedLesson } from "@/lib/stores/courses-store";
import Link from "next/link";
import Button from "@/components/ui/button";
import {
  ArrowLeft, Play, CheckCircle, Circle, Lock, ChevronDown, ChevronRight,
  Video, FileText, Download, HelpCircle, Award, Star, Send,
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

  const { data: course } = useQuery({
    queryKey: ["course-slug", slug],
    queryFn: () => getCourseBySlug(slug),
  });

  const { data: modules } = useQuery({
    queryKey: ["course-modules", course?.id],
    queryFn: () => getModules(course!.id),
    enabled: !!course,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", session?.suscriptor_id, course?.id],
    queryFn: () => getEnrollment(session!.suscriptor_id, course!.id),
    enabled: !!session && !!course,
  });

  const { data: completed } = useQuery({
    queryKey: ["completed-lessons", enrollment?.id],
    queryFn: () => getCompletedLessons(enrollment!.id),
    enabled: !!enrollment,
  });

  const { data: certificates } = useQuery({
    queryKey: ["my-certs", session?.suscriptor_id],
    queryFn: () => getMyCertificates(session!.suscriptor_id),
    enabled: !!session,
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", course?.id],
    queryFn: () => getReviews(course!.id),
    enabled: !!course,
  });

  const { data: avgRating } = useQuery({
    queryKey: ["avg-rating", course?.id],
    queryFn: () => getAvgRating(course!.id),
    enabled: !!course,
  });

  const completedIds = new Set(completed?.map((c) => c.lesson_id) || []);
  const totalLessons = modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;
  const completedCount = completedIds.size;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const hasCertificate = certificates?.some((c) => c.course_id === course?.id);

  const completeMutation = useMutation({
    mutationFn: (lessonId: string) => completeLesson(enrollment!.id, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["completed-lessons"] });
      toast.success("Lección completada");
    },
  });

  const uncompleteMutation = useMutation({
    mutationFn: (lessonId: string) => uncompleteLesson(enrollment!.id, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["completed-lessons"] });
    },
  });

  const certMutation = useMutation({
    mutationFn: () => issueCertificate(session!.suscriptor_id, course!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-certs"] });
      toast.success("¡Certificado emitido!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reviewMutation = useMutation({
    mutationFn: () => createReview(session!.suscriptor_id, course!.id, reviewRating, reviewComment || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", course?.id] });
      queryClient.invalidateQueries({ queryKey: ["avg-rating", course?.id] });
      setReviewRating(0);
      setReviewComment("");
      toast.success("¡Gracias por tu reseña!");
    },
    onError: (err: Error) => {
      if (err.message?.includes("duplicate")) toast.error("Ya dejaste una reseña");
      else toast.error(err.message);
    },
  });

  const handleQuizSubmit = async (quiz: Quiz) => {
    if (!quiz.questions) return;
    let correct = 0;
    for (const q of quiz.questions) {
      if (quizAnswers[q.id] === q.correct_option_index) correct++;
    }
    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passing_score;
    setQuizResult({ score, passed });
    await submitQuizAttempt(session!.suscriptor_id, quiz.id, score, quizAnswers);
    if (passed) {
      toast.success(`¡Aprobaste con ${score}%!`);
    } else {
      toast.error(`${score}% — necesitas ${quiz.passing_score}% para aprobar`);
    }
  };

  const handleCompleteLesson = async (lesson: Lesson) => {
    if (lesson.quiz && !completedIds.has(lesson.id)) {
      // Need to pass quiz first
      setQuizMode(true);
      setQuizAnswers({});
      setQuizResult(null);
      return;
    }
    if (completedIds.has(lesson.id)) {
      uncompleteMutation.mutate(lesson.id);
    } else {
      completeMutation.mutate(lesson.id);
    }
  };

  // Auto issue certificate
  if (progress === 100 && !hasCertificate && enrollment && !certMutation.isPending && !certMutation.isSuccess) {
    certMutation.mutate();
  }

  if (!course) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-jungle-dark/30 border-t-jungle-dark rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link href="/mi-caso/cursos" className="flex items-center gap-1 text-gray-500 text-xs hover:text-jungle-dark transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Volver a cursos
      </Link>

      {/* Course header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-jungle-dark font-bold text-lg">{course.title}</h1>
            {course.instructor_name && (
              <p className="text-gray-500 text-sm mt-0.5">{course.instructor_name}</p>
            )}
          </div>
          {avgRating && avgRating.count > 0 && (
            <div className="flex items-center gap-1 text-oro text-sm font-bold flex-shrink-0">
              <Star className="w-4 h-4 fill-oro" /> {avgRating.avg.toFixed(1)}
              <span className="text-gray-400 text-xs font-normal">({avgRating.count})</span>
            </div>
          )}
        </div>
        {course.description && <p className="text-gray-600 text-sm">{course.description}</p>}

        {/* Progress bar */}
        {enrollment && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">{completedCount}/{totalLessons} lecciones</span>
              <span className="text-xs font-bold text-jungle-dark">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-jungle-dark to-jungle rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Certificate badge */}
        {hasCertificate && (
          <div className="flex items-center gap-2 bg-oro/10 border border-oro/20 rounded-lg px-3 py-2">
            <Award className="w-5 h-5 text-oro" />
            <span className="text-sm font-medium text-oro-dark">¡Curso completado — certificado emitido!</span>
          </div>
        )}
      </div>

      {/* Active lesson viewer */}
      {activeLesson && enrollment && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {activeLesson.video_url && (
            <div className="aspect-video bg-black">
              {activeLesson.video_url.includes("youtube") || activeLesson.video_url.includes("youtu.be") ? (
                <iframe
                  src={activeLesson.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeLesson.video_url.includes("vimeo") ? (
                <iframe
                  src={activeLesson.video_url.replace("vimeo.com/", "player.vimeo.com/video/")}
                  className="w-full h-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video src={activeLesson.video_url} controls className="w-full h-full" />
              )}
            </div>
          )}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-jungle-dark font-bold text-sm">{activeLesson.title}</h3>
              <button
                onClick={() => handleCompleteLesson(activeLesson)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  completedIds.has(activeLesson.id)
                    ? "bg-green-100 border-green-200 text-green-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {completedIds.has(activeLesson.id) ? "Completada" : "Marcar completa"}
              </button>
            </div>
            {activeLesson.description && <p className="text-gray-600 text-xs">{activeLesson.description}</p>}
            {activeLesson.materials_url && (
              <a href={activeLesson.materials_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700">
                <Download className="w-3.5 h-3.5" /> Descargar material
              </a>
            )}

            {/* Quiz section */}
            {activeLesson.quiz && quizMode && activeLesson.quiz.questions && (
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-jungle-dark">{activeLesson.quiz.title}</span>
                  <span className="text-xs text-gray-400">Min. {activeLesson.quiz.passing_score}%</span>
                </div>
                {activeLesson.quiz.questions.map((q, qi) => (
                  <div key={q.id} className="space-y-1.5">
                    <p className="text-sm text-gray-700 font-medium">{qi + 1}. {q.question}</p>
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                          quizAnswers[q.id] === oi
                            ? "border-purple-300 bg-purple-50 text-purple-700"
                            : "border-gray-100 hover:bg-gray-50 text-gray-600"
                        } ${quizResult
                            ? oi === q.correct_option_index
                              ? "!border-green-300 !bg-green-50 !text-green-700"
                              : quizAnswers[q.id] === oi
                                ? "!border-red-300 !bg-red-50 !text-red-600"
                                : ""
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={quizAnswers[q.id] === oi}
                          onChange={() => !quizResult && setQuizAnswers({ ...quizAnswers, [q.id]: oi })}
                          disabled={!!quizResult}
                          className="accent-purple-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ))}
                {!quizResult ? (
                  <button
                    onClick={() => handleQuizSubmit(activeLesson.quiz!)}
                    disabled={Object.keys(quizAnswers).length < activeLesson.quiz.questions.length}
                    className="w-full bg-purple-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    Enviar respuestas
                  </button>
                ) : (
                  <div className={`p-3 rounded-lg text-sm font-medium ${quizResult.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {quizResult.passed
                      ? `¡Aprobaste con ${quizResult.score}%! Puedes marcar la lección como completada.`
                      : `${quizResult.score}% — necesitas ${activeLesson.quiz.passing_score}%. Intenta de nuevo.`
                    }
                    {!quizResult.passed && (
                      <button onClick={() => { setQuizResult(null); setQuizAnswers({}); }} className="block mt-1 underline text-xs">
                        Reintentar
                      </button>
                    )}
                    {quizResult.passed && !completedIds.has(activeLesson.id) && (
                      <button
                        onClick={() => completeMutation.mutate(activeLesson.id)}
                        className="block mt-1 underline text-xs"
                      >
                        Marcar como completada
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeLesson.quiz && !quizMode && !completedIds.has(activeLesson.id) && (
              <button
                onClick={() => { setQuizMode(true); setQuizAnswers({}); setQuizResult(null); }}
                className="flex items-center gap-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Tomar quiz para completar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modules list */}
      <div className="space-y-2">
        {modules?.map((mod) => (
          <div key={mod.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              {expandedModule === mod.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              <span className="text-jungle-dark text-sm font-medium flex-1">{mod.title}</span>
              <span className="text-gray-400 text-xs">
                {mod.lessons?.filter((l) => completedIds.has(l.id)).length || 0}/{mod.lessons?.length || 0}
              </span>
            </button>
            {expandedModule === mod.id && mod.lessons && (
              <div className="border-t border-gray-100">
                {mod.lessons.map((lesson) => {
                  const isCompleted = completedIds.has(lesson.id);
                  const isActive = activeLesson?.id === lesson.id;
                  const canAccess = enrollment || lesson.is_free;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        if (canAccess) {
                          setActiveLesson(lesson);
                          setQuizMode(false);
                          setQuizResult(null);
                          setQuizAnswers({});
                        }
                      }}
                      disabled={!canAccess}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 pl-10 text-left text-sm transition-colors ${
                        isActive ? "bg-jungle-dark/5" : "hover:bg-gray-50"
                      } ${!canAccess ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : canAccess ? (
                        <Play className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`flex-1 ${isActive ? "text-jungle-dark font-medium" : "text-gray-600"}`}>
                        {lesson.title}
                      </span>
                      {lesson.is_free && !enrollment && (
                        <span className="text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">GRATIS</span>
                      )}
                      {lesson.quiz && <HelpCircle className="w-3 h-3 text-purple-400 flex-shrink-0" />}
                      {lesson.duration > 0 && <span className="text-gray-400 text-xs">{Math.floor(lesson.duration / 60)}m</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reviews section */}
      {enrollment && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-jungle-dark font-bold text-sm flex items-center gap-2">
            <Star className="w-4 h-4" /> Reseñas
          </h3>

          {/* Leave review */}
          {!reviews?.some((r) => r.suscriptor_id === session?.suscriptor_id) && (
            <div className="space-y-2 border-b border-gray-100 pb-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    className="p-0.5"
                  >
                    <Star className={`w-5 h-5 transition-colors ${n <= reviewRating ? "text-oro fill-oro" : "text-gray-200"}`} />
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Comentario (opcional)"
                    className="flex-1 bg-gray-50 border border-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-jungle-dark/40"
                  />
                  <button
                    onClick={() => reviewMutation.mutate()}
                    disabled={reviewMutation.isPending}
                    className="bg-jungle-dark text-white px-3 py-2 rounded-lg hover:bg-jungle transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reviews list */}
          {reviews?.map((r) => (
            <div key={r.id} className="py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">{r.suscriptor_nombre}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`w-3 h-3 ${n <= r.rating ? "text-oro fill-oro" : "text-gray-200"}`} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-gray-600 text-xs">{r.comment}</p>}
            </div>
          ))}
          {reviews?.length === 0 && <p className="text-gray-400 text-xs">Sé el primero en dejar una reseña</p>}
        </div>
      )}
    </div>
  );
}
