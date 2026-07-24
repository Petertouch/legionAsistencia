import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  SEED_TEMPLATES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type MailCategory,
  type MailTemplate,
} from "@/lib/mail-templates-data";

// NOTA: La fuente de verdad de las plantillas es la BD (`mail_templates`)
// vía /api/mail/templates. Este store solo lo usa el editor visual
// (mail-builder) como borrador local; NO controla lo que se envía.

export type { MailCategory, MailTemplate };

interface MailStore {
  templates: MailTemplate[];
  updateTemplate: (id: string, updates: Partial<MailTemplate>) => void;
  toggleActive: (id: string) => void;
  getBySlug: (slug: string) => MailTemplate | undefined;
  getByCategory: (cat: MailCategory) => MailTemplate[];
}

export const useMailStore = create<MailStore>()(
  persist(
    (set, get) => ({
      templates: SEED_TEMPLATES,
      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
          ),
        })),
      toggleActive: (id) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, activo: !t.activo, updated_at: new Date().toISOString() } : t
          ),
        })),
      getBySlug: (slug) => get().templates.find((t) => t.slug === slug),
      getByCategory: (cat) =>
        get().templates.filter((t) => t.categoria === cat).sort((a, b) => a.orden - b.orden),
    }),
    {
      name: "legion-mails",
      version: 5,
      migrate: () => ({ templates: SEED_TEMPLATES }),
    }
  )
);

export { CATEGORY_LABELS, CATEGORY_COLORS };
