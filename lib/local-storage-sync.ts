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

const FLUSH_DELAY_MS = 300;

export function persistStore<T>(options: PersistOptions<T>, store: StoreApi<T>): Unsubscribe {
  if (typeof window === "undefined") return () => {};

  const { name, select } = options;
  const saved = loadFromLocalStorage<unknown>(name);
  if (saved) {
    store.setState(saved as T, true);
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingState: unknown = null;

  const flush = () => {
    timer = null;
    if (pendingState !== null) {
      const envelope: PersistEnvelope = { state: pendingState, version: 1 };
      localStorage.setItem(name, JSON.stringify(envelope));
      pendingState = null;
    }
  };

  return store.subscribe((state) => {
    pendingState = select(state);
    if (timer === null) {
      timer = setTimeout(flush, FLUSH_DELAY_MS);
    }
  });
}
