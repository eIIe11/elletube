"use client";

import { useSyncExternalStore } from "react";
import { sourceAvailable, type MediaSource } from "@/lib/availability";

const KEY = "bootube:region";
const EVENT = "bootube:region-changed";

let cached: string | null = null;
const listeners = new Set<() => void>();

function detect(): string {
  const saved = localStorage.getItem(KEY);
  if (saved) return saved;
  const locale = navigator.language?.split("-")[1];
  return locale ? locale.toUpperCase() : "AU";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): string {
  cached ??= detect();
  return cached;
}

export function setRegion(code: string) {
  cached = code.toUpperCase();
  localStorage.setItem(KEY, cached);
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new Event(EVENT));
}

/** Viewer's territory, detected from the browser locale and remembered locally. */
export function useRegion(): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => "AU");
}

export function RegionGate({
  source,
  children,
}: {
  source: MediaSource;
  children: React.ReactNode;
}) {
  const region = useRegion();

  if (sourceAvailable(source, region)) return <>{children}</>;

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl bg-surface px-6 text-center ring-1 ring-white/10">
      <p className="text-sm text-ink/85">
        This broadcaster only licences the feed inside{" "}
        {Array.isArray(source.territories)
          ? source.territories.join(", ")
          : "its own region"}
        .
      </p>
      <p className="text-xs text-muted">
        You&apos;re browsing from {region}. Plenty of worldwide channels are a tap away.
      </p>
    </div>
  );
}
