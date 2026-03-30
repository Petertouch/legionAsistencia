import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  color: string;
  order: number;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail_url: string | null;
  status: "DRAFT" | "PUBLISHED" | "DISABLED";
  is_live: boolean;
  total_hours: number;
  start_date: string | null;
  end_date: string | null;
  instructor_name: string | null;
  instructor_avatar: string | null;
  instructor_bio: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category?: CourseCategory | null;
  modules?: CourseModule[];
  enrollment_count?: number;
  avg_rating?: number;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  materials_urls: string[];
  order: number;
  is_active: boolean;
  created_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  materials_url: string | null;
  duration: number;
  order: number;
  is_free: boolean;
  created_at: string;
  quiz?: Quiz | null;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  passing_score: number;
  max_attempts: number | null;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_option_index: number;
  order: number;
}

export interface QuizAttempt {
  id: string;
  suscriptor_id: string;
  quiz_id: string;
  score: number;
  answers: Record<string, unknown> | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  suscriptor_id: string;
  course_id: string;
  enrolled_at: string;
  paid_amount: number;
  course?: Course;
}

export interface CompletedLesson {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface Certificate {
  id: string;
  suscriptor_id: string;
  course_id: string;
  pdf_url: string | null;
  issued_at: string;
  course?: Course;
}

export interface Review {
  id: string;
  suscriptor_id: string;
  course_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  suscriptor_nombre?: string;
}

// ── Helpers ────────────────────────────────────────────────────

function supabase() {
  return createClient();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Categories ─────────────────────────────────────────────────

export async function getCategories(): Promise<CourseCategory[]> {
  const { data } = await supabase()
    .from("course_categories")
    .select("*")
    .order("order");
  return (data || []) as CourseCategory[];
}

export async function createCategory(name: string): Promise<CourseCategory> {
  const { data, error } = await supabase()
    .from("course_categories")
    .insert({ name, slug: slugify(name) })
    .select()
    .single();
  if (error) throw error;
  return data as CourseCategory;
}

// ── Courses (Admin) ────────────────────────────────────────────

export async function getCoursesAdmin(): Promise<Course[]> {
  const { data } = await supabase()
    .from("courses")
    .select("*, course_categories(*)")
    .order("created_at", { ascending: false });
  return (data || []).map((c: Record<string, unknown>) => ({
    ...c,
    category: c.course_categories || null,
  })) as Course[];
}

export async function getCourseAdmin(id: string): Promise<Course | null> {
  const { data } = await supabase()
    .from("courses")
    .select("*, course_categories(*)")
    .eq("id", id)
    .single();
  if (!data) return null;
  return { ...data, category: data.course_categories || null } as unknown as Course;
}

export async function createCourse(input: {
  title: string;
  description?: string;
  price?: number;
  status?: string;
  instructor_name?: string;
  instructor_bio?: string;
  instructor_avatar?: string;
  category_id?: string | null;
  thumbnail_url?: string | null;
}): Promise<Course> {
  const slug = slugify(input.title) + "-" + Date.now().toString(36);
  const { data, error } = await supabase()
    .from("courses")
    .insert({ ...input, slug })
    .select()
    .single();
  if (error) throw error;
  return data as Course;
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
  const { data, error } = await supabase()
    .from("courses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Course;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase().from("courses").delete().eq("id", id);
  if (error) throw error;
}

// ── Modules ────────────────────────────────────────────────────

export async function getModules(courseId: string): Promise<CourseModule[]> {
  const { data } = await supabase()
    .from("course_modules")
    .select("*, lessons(*, quizzes(*, quiz_questions(*)))")
    .eq("course_id", courseId)
    .order("order")
    .order("order", { referencedTable: "lessons" });
  return (data || []).map((m: Record<string, unknown>) => ({
    ...m,
    lessons: ((m.lessons as Record<string, unknown>[]) || []).map((l) => ({
      ...l,
      quiz: Array.isArray(l.quizzes) && l.quizzes.length > 0
        ? { ...l.quizzes[0], questions: l.quizzes[0].quiz_questions || [] }
        : null,
    })),
  })) as CourseModule[];
}

export async function createModule(courseId: string, title: string, order: number): Promise<CourseModule> {
  const { data, error } = await supabase()
    .from("course_modules")
    .insert({ course_id: courseId, title, order })
    .select()
    .single();
  if (error) throw error;
  return data as CourseModule;
}

export async function updateModule(id: string, updates: Partial<CourseModule>): Promise<void> {
  const { error } = await supabase().from("course_modules").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteModule(id: string): Promise<void> {
  const { error } = await supabase().from("course_modules").delete().eq("id", id);
  if (error) throw error;
}

// ── Lessons ────────────────────────────────────────────────────

export async function createLesson(moduleId: string, input: {
  title: string;
  order: number;
  video_url?: string;
  description?: string;
  materials_url?: string;
  duration?: number;
  is_free?: boolean;
}): Promise<Lesson> {
  const { data, error } = await supabase()
    .from("lessons")
    .insert({ module_id: moduleId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data as Lesson;
}

export async function updateLesson(id: string, updates: Partial<Lesson>): Promise<void> {
  const { error } = await supabase().from("lessons").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase().from("lessons").delete().eq("id", id);
  if (error) throw error;
}

// ── Quizzes ────────────────────────────────────────────────────

export async function createQuiz(lessonId: string, title: string, passingScore: number = 70): Promise<Quiz> {
  const { data, error } = await supabase()
    .from("quizzes")
    .insert({ lesson_id: lessonId, title, passing_score: passingScore })
    .select()
    .single();
  if (error) throw error;
  return data as Quiz;
}

export async function updateQuiz(id: string, updates: { title?: string; passing_score?: number; max_attempts?: number | null }): Promise<void> {
  const { error } = await supabase().from("quizzes").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteQuiz(id: string): Promise<void> {
  const { error } = await supabase().from("quizzes").delete().eq("id", id);
  if (error) throw error;
}

export async function addQuizQuestion(quizId: string, input: {
  question: string;
  options: string[];
  correct_option_index: number;
  order: number;
}): Promise<QuizQuestion> {
  const { data, error } = await supabase()
    .from("quiz_questions")
    .insert({ quiz_id: quizId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data as QuizQuestion;
}

export async function updateQuizQuestion(id: string, updates: Partial<QuizQuestion>): Promise<void> {
  const { error } = await supabase().from("quiz_questions").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteQuizQuestion(id: string): Promise<void> {
  const { error } = await supabase().from("quiz_questions").delete().eq("id", id);
  if (error) throw error;
}

// ── Enrollments (Student) ──────────────────────────────────────

export async function getPublishedCourses(): Promise<Course[]> {
  const { data } = await supabase()
    .from("courses")
    .select("*, course_categories(*)")
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false });
  return (data || []).map((c: Record<string, unknown>) => ({
    ...c,
    category: c.course_categories || null,
  })) as Course[];
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const { data } = await supabase()
    .from("courses")
    .select("*, course_categories(*)")
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .single();
  if (!data) return null;
  return { ...data, category: data.course_categories || null } as unknown as Course;
}

export async function enrollInCourse(suscriptorId: string, courseId: string, paidAmount: number = 0): Promise<Enrollment> {
  const { data, error } = await supabase()
    .from("enrollments")
    .insert({ suscriptor_id: suscriptorId, course_id: courseId, paid_amount: paidAmount })
    .select()
    .single();
  if (error) throw error;
  return data as Enrollment;
}

export async function getMyEnrollments(suscriptorId: string): Promise<Enrollment[]> {
  const { data } = await supabase()
    .from("enrollments")
    .select("*, courses(*, course_categories(*))")
    .eq("suscriptor_id", suscriptorId)
    .order("enrolled_at", { ascending: false });
  return (data || []).map((e: Record<string, unknown>) => ({
    ...e,
    course: e.courses ? { ...(e.courses as Record<string, unknown>), category: (e.courses as Record<string, unknown>).course_categories || null } : null,
  })) as Enrollment[];
}

export async function getEnrollment(suscriptorId: string, courseId: string): Promise<Enrollment | null> {
  const { data } = await supabase()
    .from("enrollments")
    .select("*")
    .eq("suscriptor_id", suscriptorId)
    .eq("course_id", courseId)
    .single();
  return (data || null) as Enrollment | null;
}

// ── Progress ───────────────────────────────────────────────────

export async function getCompletedLessons(enrollmentId: string): Promise<CompletedLesson[]> {
  const { data } = await supabase()
    .from("completed_lessons")
    .select("*")
    .eq("enrollment_id", enrollmentId);
  return (data || []) as CompletedLesson[];
}

export async function completeLesson(enrollmentId: string, lessonId: string): Promise<CompletedLesson> {
  const { data, error } = await supabase()
    .from("completed_lessons")
    .insert({ enrollment_id: enrollmentId, lesson_id: lessonId })
    .select()
    .single();
  if (error) throw error;
  return data as CompletedLesson;
}

export async function uncompleteLesson(enrollmentId: string, lessonId: string): Promise<void> {
  const { error } = await supabase()
    .from("completed_lessons")
    .delete()
    .eq("enrollment_id", enrollmentId)
    .eq("lesson_id", lessonId);
  if (error) throw error;
}

// ── Quiz Attempts (Student) ────────────────────────────────────

export async function submitQuizAttempt(suscriptorId: string, quizId: string, score: number, answers: Record<string, unknown>): Promise<QuizAttempt> {
  const { data, error } = await supabase()
    .from("quiz_attempts")
    .insert({ suscriptor_id: suscriptorId, quiz_id: quizId, score, answers })
    .select()
    .single();
  if (error) throw error;
  return data as QuizAttempt;
}

export async function getMyQuizAttempts(suscriptorId: string, quizId: string): Promise<QuizAttempt[]> {
  const { data } = await supabase()
    .from("quiz_attempts")
    .select("*")
    .eq("suscriptor_id", suscriptorId)
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: false });
  return (data || []) as QuizAttempt[];
}

// ── Certificates ───────────────────────────────────────────────

export async function issueCertificate(suscriptorId: string, courseId: string): Promise<Certificate> {
  const { data, error } = await supabase()
    .from("certificates")
    .insert({ suscriptor_id: suscriptorId, course_id: courseId })
    .select()
    .single();
  if (error) throw error;
  return data as Certificate;
}

export async function getMyCertificates(suscriptorId: string): Promise<Certificate[]> {
  const { data } = await supabase()
    .from("certificates")
    .select("*, courses(*)")
    .eq("suscriptor_id", suscriptorId)
    .order("issued_at", { ascending: false });
  return (data || []).map((c: Record<string, unknown>) => ({
    ...c,
    course: c.courses || null,
  })) as Certificate[];
}

export async function verifyCertificate(id: string): Promise<Certificate | null> {
  const { data } = await supabase()
    .from("certificates")
    .select("*, courses(*), suscriptores(nombre)")
    .eq("id", id)
    .single();
  if (!data) return null;
  return { ...data, course: data.courses || null } as unknown as Certificate;
}

// ── Reviews ────────────────────────────────────────────────────

export async function getReviews(courseId: string): Promise<Review[]> {
  const { data } = await supabase()
    .from("reviews")
    .select("*, suscriptores(nombre)")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  return (data || []).map((r: Record<string, unknown>) => ({
    ...r,
    suscriptor_nombre: (r.suscriptores as Record<string, unknown>)?.nombre || "Anónimo",
  })) as Review[];
}

export async function createReview(suscriptorId: string, courseId: string, rating: number, comment?: string): Promise<Review> {
  const { data, error } = await supabase()
    .from("reviews")
    .insert({ suscriptor_id: suscriptorId, course_id: courseId, rating, comment })
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}

export async function getAvgRating(courseId: string): Promise<{ avg: number; count: number }> {
  const { data } = await supabase()
    .from("reviews")
    .select("rating")
    .eq("course_id", courseId);
  const ratings = (data || []) as { rating: number }[];
  if (ratings.length === 0) return { avg: 0, count: 0 };
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return { avg: sum / ratings.length, count: ratings.length };
}

// ── Admin Stats ────────────────────────────────────────────────

export async function getCourseStats(courseId: string): Promise<{
  enrollments: number;
  completions: number;
  avgRating: number;
  reviewCount: number;
}> {
  const [enrollData, certData, ratingData] = await Promise.all([
    supabase().from("enrollments").select("id", { count: "exact" }).eq("course_id", courseId),
    supabase().from("certificates").select("id", { count: "exact" }).eq("course_id", courseId),
    getAvgRating(courseId),
  ]);
  return {
    enrollments: enrollData.count || 0,
    completions: certData.count || 0,
    avgRating: ratingData.avg,
    reviewCount: ratingData.count,
  };
}
