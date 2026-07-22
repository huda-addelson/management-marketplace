"use client";

import { create } from "zustand";

import { createInitialData } from "@/lib/seed-data";
import type { FeeRule } from "@/types/domain";

type FeeState = {
  fees: FeeRule[];
  replaceFees: (fees: FeeRule[]) => void;
  addFee: (fee: FeeRule) => void;
  updateFee: (id: string, updates: Partial<FeeRule>) => void;
  archiveFee: (id: string) => void;
  resetFees: () => void;
};

const touch = () => new Date().toISOString();
const initialFees = () => createInitialData().fees;

export const useFeeStore = create<FeeState>()((set) => ({
  fees: initialFees(),
  replaceFees: (fees) => set({ fees }),
  addFee: (fee) => set((state) => ({ fees: [...state.fees, fee] })),
  updateFee: (id, updates) =>
    set((state) => ({
      fees: state.fees.map((fee) =>
        fee.id === id ? { ...fee, ...updates, updatedAt: touch() } : fee,
      ),
    })),
  archiveFee: (id) =>
    set((state) => ({
      fees: state.fees.map((fee) =>
        fee.id === id
          ? { ...fee, active: false, archivedAt: touch(), updatedAt: touch() }
          : fee,
      ),
    })),
  resetFees: () => set({ fees: initialFees() }),
}));
