"use client";

import type { StoreApi } from "zustand";

type Unsubscribe = () => void;

interface PersistOptions<T> {
  name: string;
  select: (state: T) => unknown;
}

interface PersistEnvelope {
  state: unknown;
  version: number;
}

export function loadFromLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as PersistEnvelope;
    return (envelope.state !== undefined ? envelope.state : envelope) as T;
  } catch {
    return null;
  }
}

export function persistStore<T>(options: PersistOptions<T>, store: StoreApi<T>): Unsubscribe {
  if (typeof window === "undefined") return () => {};

  const { name, select } = options;
  const saved = loadFromLocalStorage<unknown>(name);
  if (saved) {
    store.setState(saved as T, true);
  }

  return store.subscribe((state) => {
    const envelope: PersistEnvelope = { state: select(state), version: 1 };
    localStorage.setItem(name, JSON.stringify(envelope));
  });
}
