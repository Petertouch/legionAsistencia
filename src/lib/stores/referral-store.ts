import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Referral {
  id: string;
  code: string;
  // Referrer (client who recommends)
  referrer_name: string;
  referrer_cedula: string;
  referrer_suscriptor_id: string;
  // Referred (the friend)
  referred_name: string;
  referred_phone: string;
  referred_email: string;
  // Status
  status: "pendiente" | "contactado" | "cerrado";
  deuda: number; // $50,000 when closed
  created_at: string;
  closed_at: string | null;
  notes: string;
}

let idCounter = 100;
function nextId() { return `ref${++idCounter}`; }
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

interface ReferralStore {
  referrals: Referral[];
  addReferral: (data: {
    referrer_name: string;
    referrer_cedula: string;
    referrer_suscriptor_id: string;
    referred_name: string;
    referred_phone: string;
    referred_email: string;
  }) => Referral;
  updateStatus: (id: string, status: Referral["status"]) => void;
  updateNotes: (id: string, notes: string) => void;
  closeReferral: (id: string) => void;
}

const INITIAL_REFERRALS: Referral[] = [];

export const useReferralStore = create<ReferralStore>()(
  persist(
    (set) => ({
      referrals: INITIAL_REFERRALS,
      addReferral: (data) => {
        const referral: Referral = {
          id: nextId(),
          code: generateCode(),
          ...data,
          status: "pendiente",
          deuda: 0,
          created_at: new Date().toISOString(),
          closed_at: null,
          notes: "",
        };
        set((s) => ({ referrals: [referral, ...s.referrals] }));
        return referral;
      },
      updateStatus: (id, status) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        }));
      },
      updateNotes: (id, notes) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id ? { ...r, notes } : r
          ),
        }));
      },
      closeReferral: (id) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? { ...r, status: "cerrado" as const, deuda: 50000, closed_at: new Date().toISOString() }
              : r
          ),
        }));
      },
    }),
    { name: "legion-referrals", version: 2 }
  )
);
