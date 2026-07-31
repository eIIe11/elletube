"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Logo, Wordmark } from "./Logo";

const KEY = "elletube:entered";

let entered = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return entered || sessionStorage.getItem(KEY) !== null;
}

function markEntered() {
  entered = true;
  sessionStorage.setItem(KEY, "1");
  listeners.forEach((listener) => listener());
}

export function EntryScreen() {
  // Server renders "already entered" so the splash never flashes for crawlers.
  const done = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const [leaving, setLeaving] = useState(false);

  const handleEnter = useCallback(() => {
    setLeaving(true);
    window.setTimeout(markEntered, 650);
  }, []);

  useEffect(() => {
    if (done || leaving) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") handleEnter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, leaving, handleEnter]);

  if (done) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg transition-all duration-700 ${
        leaving ? "pointer-events-none scale-110 opacity-0" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora absolute -left-1/4 top-0 h-[70vh] w-[70vw] rounded-full bg-[var(--accent)]/25 blur-[140px]" />
        <div className="aurora absolute -right-1/4 bottom-0 h-[70vh] w-[70vw] rounded-full bg-[var(--accent-2)]/25 blur-[140px] [animation-delay:-9s]" />
      </div>

      <div className="fade-up relative flex flex-col items-center gap-6 px-8 text-center">
        <div className="animate-pulse-none flex items-center gap-4">
          <Logo size={72} />
          <Wordmark className="text-6xl sm:text-7xl" />
        </div>
        <p className="max-w-md text-balance text-sm text-muted sm:text-base">
          35,000+ full-length films, series and documentaries. 8,000+ live channels.
          Openly licensed. Zero ads. Ever.
        </p>
        <button
          onClick={handleEnter}
          className="group relative mt-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-10 py-4 text-base font-semibold text-white transition-transform duration-200 hover:scale-[1.04] active:scale-95"
        >
          <span className="relative z-10">Enter ElleTube</span>
          <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-500 group-hover:translate-x-0" />
        </button>
        <span className="text-xs uppercase tracking-[0.3em] text-muted/60">
          press enter
        </span>
      </div>
    </div>
  );
}
