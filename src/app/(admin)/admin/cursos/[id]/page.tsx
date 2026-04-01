"use client";

import { useState, use, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourseAdmin, updateCourse, getModules, createModule, updateModule, deleteModule,
  createLesson, updateLesson, deleteLesson, getCategories, createCategory,
  createQuiz, deleteQuiz, addQuizQuestion, updateQuizQuestion, deleteQuizQuestion,
} from "@/lib/stores/courses-store";
import type { CourseModule, Lesson, Quiz, QuizQuestion, ScriptBlock } from "@/lib/stores/courses-store";
import { useTeamStore } from "@/lib/stores/team-store";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import ScriptBlockEditor from "@/components/admin/script-block-editor";
import ScriptPreview from "@/components/admin/script-preview";
import HeyGenPanel from "@/components/admin/heygen-panel";
import type { SlideImage } from "@/lib/pdf-to-slides";
import Link from "next/link";
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical, Video, FileText,
  ChevronDown, ChevronRight, Eye, EyeOff, CheckCircle, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

const inputCls = "w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40";
const labelCls = "text-beige/60 text-xs font-medium mb-1.5 block";

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: course } = useQuery({ queryKey: ["admin-course", id], queryFn: () => getCourseAdmin(id) });
  const { data: modules, refetch: refetchModules } = useQuery({ queryKey: ["course-modules", id], queryFn: () => getModules(id) });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  // Course fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [status, setStatus] = useState("DRAFT");
  const [profesorId, setProfesorId] = useState("");
  const allMembers = useTeamStore((s) => s.abogados);
  const profesores = useMemo(() => allMembers.filter((a) => a.role === "profesor"), [allMembers]);
  const [categoryId, setCategoryId] = useState("");
  const [totalHours, setTotalHours] = useState("0");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Module/Lesson states
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonModal, setLessonModal] = useState(false);
  const [lessonModuleId, setLessonModuleId] = useState("");
  const [lessonForm, setLessonForm] = useState<{
    title: string; video_url: string; description: string; materials_url: string;
    script: string; duration: string; is_free: boolean;
    presentation_url: string; script_blocks: ScriptBlock[];
  }>({ title: "", video_url: "", description: "", materials_url: "", script: "", duration: "0", is_free: false, presentation_url: "", script_blocks: [] });
  const [lessonSlides, setLessonSlides] = useState<SlideImage[]>([]);
  const [extractingSlides, setExtractingSlides] = useState(false);
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showHeyGen, setShowHeyGen] = useState(false);

  // Quiz states
  const [quizModal, setQuizModal] = useState(false);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizPassingScore, setQuizPassingScore] = useState("70");
  const [questionModal, setQuestionModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [qForm, setQForm] = useState({ question: "", options: ["", "", "", ""], correct_option_index: 0 });
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

  // New category
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // Init form from loaded course
  if (course && !initialized) {
    setTitle(course.title);
    setDescription(course.description || "");
    setPrice(String(course.price));
    setStatus(course.status);
    const matchedProf = profesores.find((p) => p.nombre === course.instructor_name);
    setProfesorId(matchedProf?.id || "");
    setCategoryId(course.category_id || "");
    setTotalHours(String(course.total_hours));
    setThumbnailUrl(course.thumbnail_url || "");
    setInitialized(true);
  }

  // Mutations
  const selectedProfesor = profesores.find((p) => p.id === profesorId);

  const saveMutation = useMutation({
    mutationFn: () => updateCourse(id, {
      title, description, price: parseFloat(price) || 0, status: status as "DRAFT" | "PUBLISHED" | "DISABLED",
      instructor_name: selectedProfesor?.nombre || null, instructor_bio: selectedProfesor?.especialidad_academica || null,
      instructor_avatar: selectedProfesor?.avatar_url || null,
      category_id: categoryId || null, total_hours: parseInt(totalHours) || 0,
      thumbnail_url: thumbnailUrl || null,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-course", id] }); toast.success("Curso guardado"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const addModuleMutation = useMutation({
    mutationFn: () => createModule(id, newModuleTitle, (modules?.length || 0)),
    onSuccess: () => { refetchModules(); setNewModuleTitle(""); toast.success("Módulo creado"); },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: deleteModule,
    onSuccess: () => { refetchModules(); toast.success("Módulo eliminado"); },
  });

  const saveLessonMutation = useMutation({
    mutationFn: async () => {
      // Upload PDF if pending
      let presentationUrl = lessonForm.presentation_url || undefined;
      if (pendingPdfFile) {
        const formData = new FormData();
        formData.append("file", pendingPdfFile);
        formData.append("folder", "presentaciones");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Error subiendo presentación");
        const { url } = await uploadRes.json();
        presentationUrl = url;
      }

      // Combine block texts into the legacy script field for backward compat
      const blockTexts = lessonForm.script_blocks.map((b) => b.text).filter(Boolean);
      const combinedScript = blockTexts.length > 0 ? blockTexts.join("\n\n---\n\n") : (lessonForm.script || undefined);

      const payload: Record<string, unknown> = {
        title: lessonForm.title,
        video_url: lessonForm.video_url || undefined,
        description: lessonForm.description || undefined,
        materials_url: lessonForm.materials_url || undefined,
        script: combinedScript,
        presentation_url: presentationUrl || null,
        script_blocks: lessonForm.script_blocks.length > 0 ? lessonForm.script_blocks : null,
        duration: parseInt(lessonForm.duration) || 0,
        is_free: lessonForm.is_free,
      };
      if (editingLesson) { await updateLesson(editingLesson.id, payload); return; }
      const mod = modules?.find((m) => m.id === lessonModuleId);
      await createLesson(lessonModuleId, { ...payload, order: mod?.lessons?.length || 0 } as Parameters<typeof createLesson>[1]);
    },
    onSuccess: () => {
      refetchModules();
      setLessonModal(false);
      setEditingLesson(null);
      toast.success(editingLesson ? "Lección actualizada" : "Lección creada");
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => { refetchModules(); toast.success("Lección eliminada"); },
  });

  const createQuizMutation = useMutation({
    mutationFn: () => createQuiz(quizLesson!.id, quizTitle, parseInt(quizPassingScore) || 70),
    onSuccess: () => { refetchModules(); setQuizModal(false); toast.success("Quiz creado"); },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: () => { refetchModules(); toast.success("Quiz eliminado"); },
  });

  const addQuestionMutation = useMutation({
    mutationFn: () => addQuizQuestion(editingQuiz!.id, {
      question: qForm.question,
      options: qForm.options.filter((o) => o.trim()),
      correct_option_index: qForm.correct_option_index,
      order: editingQuiz!.questions?.length || 0,
    }),
    onSuccess: () => { refetchModules(); resetQuestionForm(); toast.success("Pregunta agregada"); },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: () => updateQuizQuestion(editingQuestion!.id, {
      question: qForm.question,
      options: qForm.options.filter((o) => o.trim()),
      correct_option_index: qForm.correct_option_index,
    }),
    onSuccess: () => { refetchModules(); resetQuestionForm(); toast.success("Pregunta actualizada"); },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: deleteQuizQuestion,
    onSuccess: () => { refetchModules(); toast.success("Pregunta eliminada"); },
  });

  const createCatMutation = useMutation({
    mutationFn: () => createCategory(newCategory),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCategoryId(cat.id);
      setNewCategory("");
      setShowNewCat(false);
    },
  });

  const [inlineEditId, setInlineEditId] = useState<string | null>(null);

  function openNewLesson(moduleId: string) {
    setLessonModuleId(moduleId);
    setEditingLesson(null);
    setLessonForm({ title: "", video_url: "", description: "", materials_url: "", script: "", duration: "0", is_free: false, presentation_url: "", script_blocks: [] });
    setLessonSlides([]);
    setPendingPdfFile(null);
    setPreviewMode(false);
    setShowHeyGen(false);
    setInlineEditId(`new-${moduleId}`);
  }

  function openEditLesson(lesson: Lesson, moduleId: string) {
    setLessonModuleId(moduleId);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      video_url: lesson.video_url || "",
      description: lesson.description || "",
      materials_url: lesson.materials_url || "",
      script: lesson.script || "",
      duration: String(lesson.duration),
      is_free: lesson.is_free,
      presentation_url: lesson.presentation_url || "",
      script_blocks: lesson.script_blocks || [],
    });
    setLessonSlides([]);
    setPendingPdfFile(null);
    setPreviewMode(false);
    setShowHeyGen(false);
    // If lesson has a presentation, re-extract slides from the URL
    if (lesson.presentation_url) {
      reExtractSlides(lesson.presentation_url);
    }
    setInlineEditId(lesson.id);
  }

  async function reExtractSlides(url: string) {
    try {
      setExtractingSlides(true);
      const { extractSlidesFromPdf } = await import("@/lib/pdf-to-slides");
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], "presentation.pdf", { type: "application/pdf" });
      const slides = await extractSlidesFromPdf(file);
      setLessonSlides(slides);
    } catch {
      // silent — slides just won't show previews
    } finally {
      setExtractingSlides(false);
    }
  }

  const handleExtractSlides = useCallback(async (file: File) => {
    try {
      setExtractingSlides(true);
      const { extractSlidesFromPdf } = await import("@/lib/pdf-to-slides");
      const slides = await extractSlidesFromPdf(file);
      setLessonSlides(slides);
      setPendingPdfFile(file);
    } catch (err) {
      toast.error("Error extrayendo diapositivas del PDF");
    } finally {
      setExtractingSlides(false);
    }
  }, []);

  const handlePresentationChange = useCallback((url: string | null, file: File | null) => {
    setLessonForm((f) => ({ ...f, presentation_url: url || "" }));
    setPendingPdfFile(file);
    if (!file && !url) {
      setLessonSlides([]);
    }
  }, []);

  function saveAndClose() {
    saveLessonMutation.mutate(undefined, { onSuccess: () => setInlineEditId(null) });
  }

  function cancelInlineEdit() {
    setInlineEditId(null);
    setEditingLesson(null);
  }

  function openNewQuiz(lesson: Lesson) {
    setQuizLesson(lesson);
    setQuizTitle(`Quiz: ${lesson.title}`);
    setQuizPassingScore("70");
    setQuizModal(true);
  }

  function openQuestionModal(quiz: Quiz, question?: QuizQuestion) {
    setEditingQuiz(quiz);
    setEditingQuestion(question || null);
    setQForm(question
      ? { question: question.question, options: [...question.options, "", "", "", ""].slice(0, 4), correct_option_index: question.correct_option_index }
      : { question: "", options: ["", "", "", ""], correct_option_index: 0 }
    );
    setQuestionModal(true);
  }

  function resetQuestionForm() {
    setQuestionModal(false);
    setEditingQuestion(null);
    setQForm({ question: "", options: ["", "", "", ""], correct_option_index: 0 });
  }

  if (!course) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-oro/30 border-t-oro rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/cursos" className="p-2 rounded-lg text-beige/40 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white text-lg font-bold truncate">{course.title}</h1>
        </div>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4" /> Guardar
        </Button>
      </div>

      {/* ── Course Info ── */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 space-y-4">
        <div>
          <label className={labelCls}>Título</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Precio (COP)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="1000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Horas totales</label>
            <input type="number" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} min="0" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} appearance-none`}>
              <option value="DRAFT" className="bg-jungle-dark">Borrador</option>
              <option value="PUBLISHED" className="bg-jungle-dark">Publicado</option>
              <option value="DISABLED" className="bg-jungle-dark">Deshabilitado</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Categoría</label>
            {!showNewCat ? (
              <div className="flex gap-1">
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputCls} appearance-none flex-1`}>
                  <option value="" className="bg-jungle-dark">—</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-jungle-dark">{cat.name}</option>
                  ))}
                </select>
                <button onClick={() => setShowNewCat(true)} className="p-2 text-beige/40 hover:text-oro transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex gap-1">
                <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nueva" className={`${inputCls} flex-1`} />
                <Button size="sm" onClick={() => createCatMutation.mutate()} disabled={!newCategory.trim()}>OK</Button>
                <button onClick={() => setShowNewCat(false)} className="text-beige/40 hover:text-white text-xs px-1">✕</button>
              </div>
            )}
          </div>
        </div>
        <div>
          <label className={labelCls}>Thumbnail URL</label>
          <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Profesor</label>
          {profesores.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
              <p className="text-beige/30 text-xs">No hay profesores registrados</p>
              <Link href="/admin/profesores/nuevo" className="text-oro text-xs font-medium hover:underline">Crear profesor</Link>
            </div>
          ) : (
            <div className="space-y-2">
              <select value={profesorId} onChange={(e) => setProfesorId(e.target.value)} className={`${inputCls} appearance-none`}>
                <option value="" className="bg-jungle-dark">Sin profesor asignado</option>
                {profesores.map((p) => (
                  <option key={p.id} value={p.id} className="bg-jungle-dark">{p.nombre} — {p.especialidad_academica}</option>
                ))}
              </select>
              {selectedProfesor && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: selectedProfesor.avatar_url ? "transparent" : selectedProfesor.color }}>
                    {selectedProfesor.avatar_url ? (
                      <img src={selectedProfesor.avatar_url} alt={selectedProfesor.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                        {selectedProfesor.nombre.split(" ").pop()?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{selectedProfesor.nombre}</p>
                    <p className="text-beige/40 text-xs truncate">{selectedProfesor.especialidad_academica}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modules & Lessons ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-sm font-bold">Módulos y lecciones</h2>
        </div>

        {modules?.map((mod) => (
          <div key={mod.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {/* Module header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
            >
              <GripVertical className="w-4 h-4 text-beige/20 flex-shrink-0" />
              {expandedModule === mod.id ? <ChevronDown className="w-4 h-4 text-beige/40" /> : <ChevronRight className="w-4 h-4 text-beige/40" />}
              <span className="text-white text-sm font-medium flex-1">{mod.title}</span>
              <span className="text-beige/40 text-xs">{mod.lessons?.length || 0} lecciones</span>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar módulo y sus lecciones?")) deleteModuleMutation.mutate(mod.id); }}
                className="p-1.5 text-beige/30 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lessons */}
            {expandedModule === mod.id && (
              <div className="border-t border-white/10">
                {mod.lessons?.map((lesson) => (
                  <div key={lesson.id} className="border-b border-white/5 last:border-0">
                    {/* Collapsed view */}
                    {inlineEditId !== lesson.id ? (
                      <div className="flex items-center gap-3 px-4 py-2.5 pl-12 hover:bg-white/[0.03] transition-colors group cursor-pointer"
                        onClick={() => openEditLesson(lesson, mod.id)}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {lesson.video_url ? <Video className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> : <FileText className="w-3.5 h-3.5 text-beige/30 flex-shrink-0" />}
                          <span className="text-beige/70 text-sm truncate">{lesson.title}</span>
                          {lesson.is_free && <span className="text-[9px] font-bold text-green-400 bg-green-500/15 px-1.5 py-0.5 rounded-full">GRATIS</span>}
                          {lesson.quiz && <span className="text-[9px] font-bold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><HelpCircle className="w-2.5 h-2.5" />QUIZ</span>}
                        </div>
                        {lesson.duration > 0 && <span className="text-beige/30 text-xs">{lesson.duration}min</span>}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!lesson.quiz && (
                            <button onClick={(e) => { e.stopPropagation(); openNewQuiz(lesson); }} className="p-1.5 text-beige/30 hover:text-purple-400 transition-colors" title="Agregar quiz">
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar lección?")) deleteLessonMutation.mutate(lesson.id); }} className="p-1.5 text-beige/30 hover:text-red-400 transition-colors" title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : previewMode ? (
                      /* ── Preview mode ── */
                      <div className="bg-white/[0.04] border-l-2 border-l-purple-500 px-4 py-4 pl-8 space-y-3">
                        {!showHeyGen ? (
                          <ScriptPreview
                            lessonTitle={lessonForm.title}
                            blocks={lessonForm.script_blocks}
                            slides={lessonSlides}
                            onBack={() => setPreviewMode(false)}
                            onApprove={() => setShowHeyGen(true)}
                          />
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                onClick={() => setShowHeyGen(false)}
                                className="text-beige/40 hover:text-white text-xs flex items-center gap-1 transition-colors"
                              >
                                ← Volver al preview
                              </button>
                            </div>
                            <HeyGenPanel
                              lessonTitle={lessonForm.title}
                              lessonId={editingLesson?.id}
                              blocks={lessonForm.script_blocks}
                              slides={lessonSlides}
                              presentationUrl={lessonForm.presentation_url || null}
                              onVideoGenerated={(url) => {
                                setLessonForm((f) => ({ ...f, video_url: url }));
                                toast.success("URL del video actualizada automáticamente");
                              }}
                            />
                            <div className="flex items-center gap-2 pt-2">
                              <button onClick={() => { setPreviewMode(false); setShowHeyGen(false); }} className="text-beige/40 text-xs hover:text-white transition-colors px-3 py-1.5">Volver a editar</button>
                              <Button size="sm" onClick={saveAndClose} disabled={!lessonForm.title.trim() || saveLessonMutation.isPending}>
                                <Save className="w-3.5 h-3.5" /> Guardar lección
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ── Expanded inline edit ── */
                      <div className="bg-white/[0.04] border-l-2 border-l-oro px-4 py-4 pl-12 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className={labelCls}>Título *</label>
                            <input type="text" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className={inputCls} autoFocus />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelCls}>URL del video</label>
                            <input type="text" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} placeholder="https://youtube.com/..." className={inputCls} />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelCls}>Descripción</label>
                            <textarea value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
                          </div>
                          <div>
                            <label className={labelCls}>Material (URL)</label>
                            <input type="text" value={lessonForm.materials_url} onChange={(e) => setLessonForm({ ...lessonForm, materials_url: e.target.value })} placeholder="PDF, doc..." className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Duración (min)</label>
                            <input type="number" value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} min="0" className={inputCls} />
                          </div>
                        </div>

                        {/* Guión del profesor — Block editor */}
                        <div className="border-t border-white/10 pt-3 mt-1">
                          <ScriptBlockEditor
                            blocks={lessonForm.script_blocks}
                            onChange={(blocks) => setLessonForm({ ...lessonForm, script_blocks: blocks })}
                            presentationUrl={lessonForm.presentation_url || null}
                            onPresentationChange={handlePresentationChange}
                            slides={lessonSlides}
                            onExtractSlides={handleExtractSlides}
                            extracting={extractingSlides}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 text-sm text-beige/60 cursor-pointer">
                            <input type="checkbox" checked={lessonForm.is_free} onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })} className="accent-oro" />
                            Lección gratuita (preview)
                          </label>
                          <div className="flex items-center gap-2">
                            {lessonForm.script_blocks.filter((b) => b.text.trim()).length > 0 && (
                              <Button size="sm" variant="ghost" onClick={() => setPreviewMode(true)} className="text-purple-400 hover:text-purple-300 border-purple-500/30">
                                <Eye className="w-3.5 h-3.5" /> Previsualizar guión
                              </Button>
                            )}
                            <button onClick={cancelInlineEdit} className="text-beige/40 text-xs hover:text-white transition-colors px-3 py-1.5">Cancelar</button>
                            <Button size="sm" onClick={saveAndClose} disabled={!lessonForm.title.trim() || saveLessonMutation.isPending}>
                              <Save className="w-3.5 h-3.5" /> {saveLessonMutation.isPending ? "Guardando..." : "Guardar"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Quiz questions inline (if expanded module has quizzes) */}
                {mod.lessons?.filter((l) => l.quiz && l.quiz.questions && l.quiz.questions.length > 0).map((lesson) => (
                  <div key={`quiz-${lesson.id}`} className="px-4 py-2 pl-16 border-t border-white/5 bg-purple-500/[0.03]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-purple-400 text-xs font-medium">{lesson.quiz!.title} — {lesson.quiz!.questions!.length} preguntas (min {lesson.quiz!.passing_score}%)</span>
                      <div className="flex gap-1">
                        <button onClick={() => openQuestionModal(lesson.quiz!)} className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors">+ Pregunta</button>
                        <button onClick={() => { if (confirm("¿Eliminar quiz completo?")) deleteQuizMutation.mutate(lesson.quiz!.id); }} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors ml-2">Eliminar quiz</button>
                      </div>
                    </div>
                    {lesson.quiz!.questions!.map((q, qi) => (
                      <div key={q.id} className="flex items-start gap-2 py-1 text-xs group/q">
                        <span className="text-beige/30 mt-0.5">{qi + 1}.</span>
                        <span className="text-beige/50 flex-1">{q.question}</span>
                        <span className="text-green-400/60">{q.options[q.correct_option_index]}</span>
                        <div className="flex gap-1 opacity-0 group-hover/q:opacity-100 transition-opacity">
                          <button onClick={() => openQuestionModal(lesson.quiz!, q)} className="text-beige/30 hover:text-oro transition-colors">edit</button>
                          <button onClick={() => { if (confirm("¿Eliminar pregunta?")) deleteQuestionMutation.mutate(q.id); }} className="text-beige/30 hover:text-red-400 transition-colors">del</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* New lesson inline form */}
                {inlineEditId === `new-${mod.id}` ? (
                  <div className="bg-white/[0.04] border-l-2 border-l-green-500 px-4 py-4 pl-12 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Título *</label>
                        <input type="text" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className={inputCls} autoFocus placeholder="Nombre de la lección" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>URL del video</label>
                        <input type="text" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} placeholder="https://youtube.com/..." className={inputCls} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Descripción</label>
                        <textarea value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
                      </div>
                      <div>
                        <label className={labelCls}>Material (URL)</label>
                        <input type="text" value={lessonForm.materials_url} onChange={(e) => setLessonForm({ ...lessonForm, materials_url: e.target.value })} placeholder="PDF, doc..." className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Duración (min)</label>
                        <input type="number" value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} min="0" className={inputCls} />
                      </div>
                    </div>

                    {/* Guión del profesor — Block editor */}
                    <div className="border-t border-white/10 pt-3 mt-1">
                      <ScriptBlockEditor
                        blocks={lessonForm.script_blocks}
                        onChange={(blocks) => setLessonForm({ ...lessonForm, script_blocks: blocks })}
                        presentationUrl={lessonForm.presentation_url || null}
                        onPresentationChange={handlePresentationChange}
                        slides={lessonSlides}
                        onExtractSlides={handleExtractSlides}
                        extracting={extractingSlides}
                      />
                    </div>

                    {/* HeyGen video generation — new lessons */}
                    {lessonForm.script_blocks.length > 0 && (
                      <HeyGenPanel
                        lessonTitle={lessonForm.title}
                        blocks={lessonForm.script_blocks}
                        slides={lessonSlides}
                        presentationUrl={lessonForm.presentation_url || null}
                        onVideoGenerated={(url) => {
                          setLessonForm((f) => ({ ...f, video_url: url }));
                        }}
                      />
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-sm text-beige/60 cursor-pointer">
                        <input type="checkbox" checked={lessonForm.is_free} onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })} className="accent-oro" />
                        Lección gratuita (preview)
                      </label>
                      <div className="flex items-center gap-2">
                        <button onClick={cancelInlineEdit} className="text-beige/40 text-xs hover:text-white transition-colors px-3 py-1.5">Cancelar</button>
                        <Button size="sm" onClick={saveAndClose} disabled={!lessonForm.title.trim() || saveLessonMutation.isPending}>
                          <Plus className="w-3.5 h-3.5" /> {saveLessonMutation.isPending ? "Creando..." : "Crear lección"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openNewLesson(mod.id)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 pl-12 text-beige/40 hover:text-oro text-xs hover:bg-white/[0.03] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar lección
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add module */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="Nombre del nuevo módulo..."
            className={`${inputCls} flex-1`}
            onKeyDown={(e) => { if (e.key === "Enter" && newModuleTitle.trim()) addModuleMutation.mutate(); }}
          />
          <Button size="sm" onClick={() => addModuleMutation.mutate()} disabled={!newModuleTitle.trim()}>
            <Plus className="w-4 h-4" /> Módulo
          </Button>
        </div>
      </div>

      {/* ── Quiz Creation Modal ── */}
      <Modal
        open={quizModal}
        onClose={() => setQuizModal(false)}
        title="Crear Quiz"
        actions={
          <>
            <Button variant="ghost" onClick={() => setQuizModal(false)}>Cancelar</Button>
            <Button onClick={() => createQuizMutation.mutate()} disabled={!quizTitle.trim()}>Crear</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Título del quiz</label>
            <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Puntaje mínimo (%)</label>
            <input type="number" value={quizPassingScore} onChange={(e) => setQuizPassingScore(e.target.value)} min="0" max="100" className={inputCls} />
          </div>
        </div>
      </Modal>

      {/* ── Question Modal ── */}
      <Modal
        open={questionModal}
        onClose={resetQuestionForm}
        title={editingQuestion ? "Editar pregunta" : "Nueva pregunta"}
        actions={
          <>
            <Button variant="ghost" onClick={resetQuestionForm}>Cancelar</Button>
            <Button
              onClick={() => editingQuestion ? updateQuestionMutation.mutate() : addQuestionMutation.mutate()}
              disabled={!qForm.question.trim() || qForm.options.filter((o) => o.trim()).length < 2}
            >
              {editingQuestion ? "Guardar" : "Agregar"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Pregunta</label>
            <textarea value={qForm.question} onChange={(e) => setQForm({ ...qForm, question: e.target.value })} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Opciones (mín. 2)</label>
            {qForm.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name="correct"
                  checked={qForm.correct_option_index === i}
                  onChange={() => setQForm({ ...qForm, correct_option_index: i })}
                  className="accent-green-500"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const opts = [...qForm.options];
                    opts[i] = e.target.value;
                    setQForm({ ...qForm, options: opts });
                  }}
                  placeholder={`Opción ${i + 1}`}
                  className={inputCls}
                />
              </div>
            ))}
            <p className="text-beige/30 text-xs">Selecciona el radio de la respuesta correcta</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
