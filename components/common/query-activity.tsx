"use client";

import { useIsFetching, useIsMutating } from "@tanstack/react-query";

export function QueryActivity() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching + mutating > 0;

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
      >
        <div className="h-full w-full animate-pulse bg-gradient-to-r from-sky-400 via-blue-600 to-cyan-400" />
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {active ? "Permintaan data sedang diproses." : "Data siap digunakan."}
      </span>
    </>
  );
}
