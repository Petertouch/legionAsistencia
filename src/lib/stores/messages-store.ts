import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CaseMessage {
  id: string;
  caso_id: string;
  sender: "cliente" | "abogado";
  sender_name: string;
  content: string;
  created_at: string;
}

let idCounter = 100;
function nextId() { return `msg${++idCounter}`; }

const INITIAL_MESSAGES: CaseMessage[] = [
  {
    id: "msg1", caso_id: "c1", sender: "abogado", sender_name: "Dr. Ramirez",
    content: "Buenos días Sargento. Ya recibí la citación a descargos. Estoy preparando el memorial de defensa. Le comparto el borrador mañana.",
    created_at: "2026-03-14T09:00:00Z",
  },
  {
    id: "msg2", caso_id: "c1", sender: "cliente", sender_name: "Sgto. Juan Felipe Pulido",
    content: "Buenos días Doctor. Gracias. ¿Necesita algún documento adicional de mi parte?",
    created_at: "2026-03-14T10:30:00Z",
  },
  {
    id: "msg3", caso_id: "c1", sender: "abogado", sender_name: "Dr. Ramirez",
    content: "Sí, necesito la copia de la orden de servicio de esa noche y si tiene testigos que puedan declarar a su favor, páseme los nombres.",
    created_at: "2026-03-14T11:00:00Z",
  },
  {
    id: "msg4", caso_id: "c4", sender: "abogado", sender_name: "Dr. Ramirez",
    content: "Sargento, le confirmo que la audiencia quedó programada para el 25 de marzo. Necesitamos reunirnos antes para preparar su declaración.",
    created_at: "2026-03-12T14:00:00Z",
  },
  {
    id: "msg5", caso_id: "c4", sender: "cliente", sender_name: "Sgto. Juan Felipe Pulido",
    content: "Entendido Doctor. ¿Puede ser el lunes 23 en la oficina?",
    created_at: "2026-03-12T15:00:00Z",
  },
  {
    id: "msg6", caso_id: "c11", sender: "abogado", sender_name: "Dra. Lopez",
    content: "Sargento, el derecho de petición ya está listo para radicar mañana en el Ministerio de Defensa. Le adjunto copia para su revisión.",
    created_at: "2026-03-15T16:00:00Z",
  },
];

interface MessagesStore {
  messages: CaseMessage[];
  getMessages: (casoId: string) => CaseMessage[];
  addMessage: (data: { caso_id: string; sender: "cliente" | "abogado"; sender_name: string; content: string }) => CaseMessage;
}

export const useMessagesStore = create<MessagesStore>()(
  persist(
    (set, get) => ({
      messages: INITIAL_MESSAGES,
      getMessages: (casoId) => get().messages.filter((m) => m.caso_id === casoId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      addMessage: (data) => {
        const msg: CaseMessage = {
          id: nextId(),
          ...data,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ messages: [...s.messages, msg] }));
        return msg;
      },
    }),
    { name: "legion-messages", version: 1 }
  )
);
