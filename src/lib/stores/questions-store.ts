import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_CASOS, MOCK_SUSCRIPTORES, type Caso, type Suscriptor } from "@/lib/mock-data";
import type { CaseArea } from "@/lib/pipelines";

// ── LocalStorage persistence keys ──────────────────────────────
const LS_CONSULTAS = "legion-consultas";
const LS_FREE_SUSCRIPTORES = "legion-free-suscriptores";
const LS_PASSWORDS = "legion-blog-passwords";

function isBrowser() {
  return typeof window !== "undefined";
}

function loadFromLS<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToLS<T>(key: string, data: T[]) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Sync persisted data into MOCK arrays on load ────────────────
let synced = false;

export function syncPersistedData() {
  if (!isBrowser() || synced) return;
  synced = true;

  // Sync free suscriptores
  const savedSus = loadFromLS<Suscriptor>(LS_FREE_SUSCRIPTORES);
  for (const s of savedSus) {
    if (!MOCK_SUSCRIPTORES.find((x) => x.id === s.id)) {
      MOCK_SUSCRIPTORES.push(s);
    }
  }

  // Sync consultas
  const savedCasos = loadFromLS<Caso>(LS_CONSULTAS);
  for (const c of savedCasos) {
    if (!MOCK_CASOS.find((x) => x.id === c.id)) {
      MOCK_CASOS.push(c);
    }
  }

  // Sync passwords
  const savedPw = loadPasswordsFromLS();
  Object.assign(BLOG_PASSWORDS, savedPw);
}

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

  // Persist to localStorage
  const saved = loadFromLS<Suscriptor>(LS_FREE_SUSCRIPTORES);
  saved.push(s);
  saveToLS(LS_FREE_SUSCRIPTORES, saved);

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
    suscriptor_nombre_real: data.suscriptor.nombre,
    suscriptor_cedula: data.suscriptor.cedula,
    suscriptor_email: data.email,
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
    notas_etapa: `Área de interés: ${data.area}\nEmail: ${data.email}\nAnónimo: ${data.anonimo ? "Sí" : "No"}\nNombre real: ${data.suscriptor.nombre}\nCédula: ${data.suscriptor.cedula}`,
    created_at: now,
    updated_at: now,
  };

  MOCK_CASOS.push(caso);

  // Persist to localStorage
  const saved = loadFromLS<Caso>(LS_CONSULTAS);
  saved.push(caso);
  saveToLS(LS_CONSULTAS, saved);

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

function loadPasswordsFromLS(): Record<string, string> {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(LS_PASSWORDS);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function savePasswordsToLS() {
  if (!isBrowser()) return;
  localStorage.setItem(LS_PASSWORDS, JSON.stringify(BLOG_PASSWORDS));
}

export function setBlogPassword(cedula: string, password: string) {
  BLOG_PASSWORDS[cedula] = password;
  savePasswordsToLS();
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
