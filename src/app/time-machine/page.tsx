"use client";

import { useEffect, useMemo, useState } from "react";
import { PosterCard } from "@/components/Card";
import { loadDiscover, toCard, type DiscoverIndex } from "@/lib/discover";

const DECADES = [
  { start: 1900, label: "1900s", vibe: "Dawn of cinema", bg: "#1a1610" },
  { start: 1910, label: "1910s", vibe: "Silent pioneers", bg: "#17140f" },
  { start: 1920, label: "1920s", vibe: "Jazz age", bg: "#1d1508" },
  { start: 1930, label: "1930s", vibe: "Pre-code & noir", bg: "#0f1218" },
  { start: 1940, label: "1940s", vibe: "Wartime screen", bg: "#101613" },
  { start: 1950, label: "1950s", vibe: "Atomic technicolor", bg: "#1b0f14" },
  { start: 1960, label: "1960s", vibe: "New wave", bg: "#140f1d" },
  { start: 1970, label: "1970s", vibe: "Grindhouse & grit", bg: "#1d1208" },
  { start: 1980, label: "1980s", vibe: "Neon video age", bg: "#12081d" },
  { start: 1990, label: "1990s", vibe: "Indie boom", bg: "#0a1418" },
  { start: 2000, label: "2000s", vibe: "Digital shift", bg: "#0d1014" },
  { start: 2010, label: "2010s", vibe: "Streaming era", bg: "#0c0f10" },
  { start: 2020, label: "2020s", vibe: "Now", bg: "#0a0a0c" },
];

export default function TimeMachinePage() {
  const [index, setIndex] = useState<DiscoverIndex | null>(null);
  const [decade, setDecade] = useState(1970);

  useEffect(() => {
    void loadDiscover().then(setIndex);
  }, []);

  const active = DECADES.find((d) => d.start === decade) ?? DECADES[0];

  const results = useMemo(() => {
    if (!index) return [];
    return index.items
      .filter((item) => item[2] >= decade && item[2] < decade + 10)
      .slice(0, 96)
      .map((item) => toCard(item, index.genres));
  }, [index, decade]);

  return (
    <div
      className="min-h-screen px-4 py-10 transition-colors duration-700 sm:px-8"
      style={{ backgroundColor: active.bg }}
    >
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Time Machine
      </h1>
      <p className="mt-2 text-sm text-muted">
        Spin the dial. The room changes with the decade.
      </p>

      <div className="rail mt-8 flex gap-2 overflow-x-auto pb-2">
        {DECADES.map((entry) => (
          <button
            key={entry.start}
            onClick={() => setDecade(entry.start)}
            className={`shrink-0 rounded-2xl px-5 py-4 text-left transition-all duration-300 hover:scale-105 ${
              entry.start === decade
                ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white"
                : "bg-white/8 text-muted hover:text-ink"
            }`}
          >
            <span className="block text-lg font-semibold">{entry.label}</span>
            <span className="block text-[11px] opacity-80">{entry.vibe}</span>
          </button>
        ))}
      </div>

      {!index && <p className="mt-10 text-sm text-muted">Warming up the flux capacitor…</p>}

      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {results.map((item) => (
          <PosterCard key={item.i} item={item} />
        ))}
      </div>

      {index && !results.length && (
        <p className="mt-10 text-sm text-muted">Nothing catalogued from this decade yet.</p>
      )}
    </div>
  );
}
