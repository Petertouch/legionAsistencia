import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_CASOS, MOCK_SUSCRIPTORES, type Caso, type Suscriptor } from "@/lib/mock-data";
import type { CaseArea } from "@/lib/pipelines";

// ── Suscriptor registration for free users ──────────────────────
let regCounter = 500;

export function registerFreeSuscriptor(data: {
  nombre: string; telefono: string; email: string; cedula: string;
  rama: string; rango: string;
}): Suscriptor {
  // Check if already exists
  const existing = MOCK_SUSCRIPTORES.find((s) => s.cedula === data.cedula);
  if (existing) return existing;

  const now = new Date().toISOString();
  const s: Suscriptor = {
    id: `s${++regCounter}`,
    nombre: data.nombre,
    telefono: data.telefono,
    email: data.email,
    cedula: data.cedula,
    plan: "Gratuito" as Suscriptor["plan"],
    estado_pago: "Al dia",
    rama: data.rama,
    rango: data.rango,
    fecha_inicio: now.split("T")[0],
    notas: "Registrado desde Guía Legal",
    created_at: now,
    updated_at: now,
  };
  MOCK_SUSCRIPTORES.push(s);
  return s;
}

// ── Create consulta as a Caso ───────────────────────────────────
const ABOGADOS_POOL = ["Dr. Ramirez", "Dra. Lopez", "Dr. Martinez"];
let consultaCounter = 300;

export function createConsultaCaso(data: {
  suscriptor: Suscriptor;
  pregunta: string;
  area: string;
  anonimo: boolean;
  email: string;
}): Caso {
  const now = new Date().toISOString();
  // Round-robin assign
  const abogado = ABOGADOS_POOL[consultaCounter % ABOGADOS_POOL.length];

  const caso: Caso = {
    id: `cq${++consultaCounter}`,
    suscriptor_id: data.suscriptor.id,
    suscriptor_nombre: data.anonimo ? "Anónimo" : data.suscriptor.nombre,
    area: "Consulta" as CaseArea,
    titulo: data.pregunta.length > 80 ? data.pregunta.slice(0, 77) + "..." : data.pregunta,
    etapa: "Pendiente",
    etapa_index: 0,
    prioridad: "normal",
    abogado,
    descripcion: data.pregunta,
    fecha_limite: null,
    fecha_ingreso_etapa: now,
    fecha_audiencia: null,
    fecha_cierre: null,
    checklist: {},
    notas_etapa: `Área de interés: ${data.area}\nEmail: ${data.email}\nAnónimo: ${data.anonimo ? "Sí" : "No"}`,
    created_at: now,
    updated_at: now,
  };

  MOCK_CASOS.push(caso);
  return caso;
}

// ── Store for blog-specific state (auth, submissions) ───────────
export interface BlogUser {
  suscriptor_id: string;
  nombre: string;
  cedula: string;
  email: string;
}

interface QuestionsStore {
  blogUser: BlogUser | null;
  loginBlog: (user: BlogUser) => void;
  logoutBlog: () => void;
}

export const useQuestionsStore = create<QuestionsStore>()(
  persist(
    (set) => ({
      blogUser: null,
      loginBlog: (user) => set({ blogUser: user }),
      logoutBlog: () => set({ blogUser: null }),
    }),
    { name: "legion-blog-auth", version: 1 }
  )
);

// ── Passwords store for blog users ──────────────────────────────
const BLOG_PASSWORDS: Record<string, string> = {
  "123": "123", // test user
};

export function setBlogPassword(cedula: string, password: string) {
  BLOG_PASSWORDS[cedula] = password;
}

export function verifyBlogPassword(cedula: string, password: string): boolean {
  return BLOG_PASSWORDS[cedula] === password;
}

// ── Get answered consultas for public blog ──────────────────────
export function getAnsweredConsultas(): Caso[] {
  return MOCK_CASOS.filter(
    (c) => c.area === ("Consulta" as CaseArea) && (c.etapa === "Respondida" || c.etapa === "Cerrado")
  );
}
