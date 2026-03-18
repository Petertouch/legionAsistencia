import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PreguntaPublica {
  id: string;
  nombre: string;
  telefono: string;
  rama: string;
  area: string;
  pregunta: string;
  respuesta: string | null;
  estado: "pendiente" | "respondida";
  created_at: string;
  responded_at: string | null;
}

const INITIAL_PREGUNTAS: PreguntaPublica[] = [
  {
    id: "pq1", nombre: "Cb. Luis Herrera", telefono: "3201234567", rama: "Ejército",
    area: "Disciplinarios", pregunta: "Me abrieron investigación por llegar tarde a formación dos veces. ¿Qué tan grave es eso y qué puedo hacer?",
    respuesta: "Llegar tarde a formación puede considerarse una falta leve o grave dependiendo del reglamento interno y las circunstancias. Le recomendamos reunir cualquier evidencia que justifique las llegadas tarde (órdenes médicas, permisos, etc.) y preparar sus descargos con un abogado. Contáctenos por WhatsApp para revisar su caso específico.",
    estado: "respondida", created_at: "2026-03-16T08:00:00Z", responded_at: "2026-03-16T14:30:00Z",
  },
  {
    id: "pq2", nombre: "Pt. Sandra Ríos", telefono: "3109876543", rama: "Policía",
    area: "Derechos Laborales", pregunta: "Llevo 3 meses sin que me paguen las horas extra de los turnos nocturnos. ¿A quién puedo reclamar?",
    respuesta: null, estado: "pendiente", created_at: "2026-03-17T22:00:00Z", responded_at: null,
  },
];

interface QuestionsStore {
  preguntas: PreguntaPublica[];
  idCounter: number;
  addPregunta: (data: Omit<PreguntaPublica, "id" | "respuesta" | "estado" | "created_at" | "responded_at">) => void;
  responder: (id: string, respuesta: string) => void;
  deletePregunta: (id: string) => void;
}

export const useQuestionsStore = create<QuestionsStore>()(
  persist(
    (set) => ({
      preguntas: INITIAL_PREGUNTAS,
      idCounter: 10,
      addPregunta: (data) =>
        set((s) => ({
          preguntas: [
            { ...data, id: `pq${s.idCounter}`, respuesta: null, estado: "pendiente", created_at: new Date().toISOString(), responded_at: null },
            ...s.preguntas,
          ],
          idCounter: s.idCounter + 1,
        })),
      responder: (id, respuesta) =>
        set((s) => ({
          preguntas: s.preguntas.map((p) =>
            p.id === id ? { ...p, respuesta, estado: "respondida" as const, responded_at: new Date().toISOString() } : p
          ),
        })),
      deletePregunta: (id) =>
        set((s) => ({ preguntas: s.preguntas.filter((p) => p.id !== id) })),
    }),
    { name: "legion-questions", version: 1 }
  )
);
