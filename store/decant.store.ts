"use client";

import { create } from "zustand";

import { createInitialData } from "@/lib/seed-data";
import type { DecantRecipe, VialCost } from "@/types/domain";

type DecantState = {
  decants: DecantRecipe[];
  vialCosts: VialCost[];
  replaceDecantData: (decants: DecantRecipe[], vialCosts: VialCost[]) => void;
  addDecant: (decant: DecantRecipe) => void;
  updateDecant: (id: string, updates: Partial<DecantRecipe>) => void;
  deleteDecant: (id: string) => void;
  addVial: (vial: VialCost) => void;
  updateVial: (id: string, updates: Partial<VialCost>) => void;
  deleteVial: (id: string) => void;
  resetDecants: () => void;
};

const touch = () => new Date().toISOString();
const initialDecantData = () => {
  const seed = createInitialData();
  return { decants: seed.decants, vialCosts: seed.vialCosts };
};

export const useDecantStore = create<DecantState>()((set) => ({
  ...initialDecantData(),
  replaceDecantData: (decants, vialCosts) => set({ decants, vialCosts }),
  addDecant: (decant) => set((state) => ({ decants: [...state.decants, decant] })),
  updateDecant: (id, updates) =>
    set((state) => ({
      decants: state.decants.map((decant) =>
        decant.id === id ? { ...decant, ...updates, updatedAt: touch() } : decant,
      ),
    })),
  deleteDecant: (id) =>
    set((state) => ({ decants: state.decants.filter((decant) => decant.id !== id) })),
  addVial: (vial) => set((state) => ({ vialCosts: [...state.vialCosts, vial] })),
  updateVial: (id, updates) =>
    set((state) => ({
      vialCosts: state.vialCosts.map((vial) =>
        vial.id === id ? { ...vial, ...updates, updatedAt: touch() } : vial,
      ),
    })),
  deleteVial: (id) =>
    set((state) => ({
      vialCosts: state.vialCosts.filter((vial) => vial.id !== id),
      decants: state.decants.map((decant) =>
        decant.vialCostId === id
          ? { ...decant, vialCostId: null, updatedAt: touch() }
          : decant,
      ),
    })),
  resetDecants: () => set(initialDecantData()),
}));
