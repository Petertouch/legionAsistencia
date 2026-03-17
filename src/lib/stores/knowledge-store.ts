import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface KnowledgeItem {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIES = [
  "General",
  "Planes y precios",
  "Procesos legales",
  "Documentos",
  "Pagos",
  "Contacto",
];

let idCounter = 50;
function nextId() { return `kb${++idCounter}`; }

const INITIAL_ITEMS: KnowledgeItem[] = [
  {
    id: "kb1", categoria: "General",
    pregunta: "¿Qué es Legión Jurídica?",
    respuesta: "Legión Jurídica es un servicio de asistencia legal por suscripción mensual diseñado exclusivamente para militares y policías de Colombia. Ofrecemos asesoría jurídica ilimitada, revisión de documentos, acompañamiento a audiencias y más, todo por una cuota mensual fija.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb2", categoria: "General",
    pregunta: "¿Quiénes pueden afiliarse?",
    respuesta: "Cualquier miembro activo o retirado de las Fuerzas Militares (Ejército, Armada, Fuerza Aérea) o la Policía Nacional de Colombia. También cubrimos familiares directos en el Plan Élite.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb3", categoria: "Procesos legales",
    pregunta: "¿Qué hago si me llega una citación a descargos?",
    respuesta: "No firmes nada sin asesoría. Contacta inmediatamente a tu abogado asignado por WhatsApp o llamada. Tenemos experiencia en procesos disciplinarios militares y policiales. El tiempo es clave: entre más rápido actuemos, mejor será tu defensa.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb4", categoria: "Procesos legales",
    pregunta: "¿Qué es un consejo de guerra?",
    respuesta: "Es un tribunal militar que juzga delitos cometidos por miembros de la fuerza pública en relación con el servicio. Si estás citado a un consejo de guerra, necesitas un abogado penalista militar de inmediato. En Legión Jurídica tenemos especialistas en esta área.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb5", categoria: "Documentos",
    pregunta: "¿Qué es un derecho de petición y cuándo lo necesito?",
    respuesta: "Es un documento legal que te permite solicitar información o hacer reclamaciones ante cualquier entidad pública o privada. Es útil para temas de ascensos, traslados, prestaciones, pensiones, etc. En Legión lo redactamos y radicamos por ti.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb6", categoria: "Documentos",
    pregunta: "¿Qué es una tutela?",
    respuesta: "Es una acción constitucional para proteger tus derechos fundamentales cuando están siendo vulnerados. Es rápida (el juez debe responder en 10 días). La usamos frecuentemente para temas de salud, prestaciones sociales y derechos laborales de militares y policías.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb7", categoria: "Pagos",
    pregunta: "¿Cómo pago mi suscripción?",
    respuesta: "Aceptamos transferencia bancaria, Nequi, Daviplata y pago en efectivo en nuestra oficina. El pago es mensual y se realiza los primeros 5 días de cada mes. Te enviamos recordatorio por WhatsApp.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb8", categoria: "Pagos",
    pregunta: "¿Qué pasa si no pago a tiempo?",
    respuesta: "Tienes 5 días de gracia después de la fecha de pago. Si no pagas en ese periodo, tu servicio queda suspendido hasta que te pongas al día. No pierdes tu historial ni tus casos, solo se pausa la atención hasta regularizar el pago.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
];

interface KnowledgeStore {
  items: KnowledgeItem[];
  categories: string[];
  addItem: (data: { pregunta: string; respuesta: string; categoria: string }) => KnowledgeItem;
  updateItem: (id: string, data: Partial<Pick<KnowledgeItem, "pregunta" | "respuesta" | "categoria" | "activo">>) => void;
  deleteItem: (id: string) => void;
  toggleItem: (id: string) => void;
  addCategory: (name: string) => void;
}

export const useKnowledgeStore = create<KnowledgeStore>()(
  persist(
    (set, get) => ({
      items: INITIAL_ITEMS,
      categories: DEFAULT_CATEGORIES,
      addItem: (data) => {
        const item: KnowledgeItem = {
          id: nextId(),
          ...data,
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((s) => ({ items: [...s.items, item] }));
        return item;
      },
      updateItem: (id, data) => {
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, ...data, updated_at: new Date().toISOString() } : i
          ),
        }));
      },
      deleteItem: (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      },
      toggleItem: (id) => {
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, activo: !i.activo, updated_at: new Date().toISOString() } : i
          ),
        }));
      },
      addCategory: (name) => {
        const cats = get().categories;
        if (!cats.includes(name)) set({ categories: [...cats, name] });
      },
    }),
    { name: "legion-knowledge" }
  )
);
