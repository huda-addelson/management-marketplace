"use client";

import { create } from "zustand";

import { createInitialData } from "@/lib/seed-data";
import type { AppSettings } from "@/types/domain";

type SettingsState = {
  settings: AppSettings;
  replaceSettings: (settings: AppSettings) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
};

const initialSettings = () => createInitialData().settings;

export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: initialSettings(),
  replaceSettings: (settings) => set({ settings }),
  updateSettings: (settings) =>
    set((state) => ({ settings: { ...state.settings, ...settings } })),
  resetSettings: () => set({ settings: initialSettings() }),
}));
