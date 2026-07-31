"use client";

import { useEffect, useMemo, useState } from "react";
import { PosterCard } from "@/components/Card";
import { loadDiscover, toCard, type DiscoverIndex } from "@/lib/discover";

/**
 * Mood mixer: three sliders are mapped onto genre weights, and titles are
 * scored against the resulting vector. Everything runs client-side over the
 * compact discovery index, so dragging re-ranks 35k titles instantly.
 */
const AXES = [
  {
    key: "energy",
    left: "Cosy",
    right: "Unhinged",
    low: ["Kids & Family", "Nature", "Romance", "Wellness", "Food", "Musicals"],
    high: ["Horror", "Cult Classics", "Thriller", "Action", "Martial Arts", "True Crime"],
  },
  {
    key: "brain",
    left: "Switch off",
    right: "Big think",
    low: ["Comedy", "Reality TV", "Animation", "Action", "Talk Shows"],
    high: ["Documentary", "Science", "History", "Space", "Politics", "World Cinema"],
  },
  {
    key: "era",
    left: "Vintage",
    right: "Modern",
    low: ["Silent Era", "Film Noir", "Westerns", "Serials", "Classic TV"],
    high: ["Reality TV", "LGBTQ+", "Sapphic Cinema", "Concerts", "Open Movies"],
  },
] as const;

export default function MoodPage() {
  const [index, setIndex] = useState<DiscoverIndex | null>(null);
  const [mix, setMix] = useState({ energy: 50, brain: 50, era: 50 });

  useEffect(() => {
    void loadDiscover().then(setIndex);
  }, []);

  const weights = useMemo(() => {
    if (!index) return null;
    const map = new Map(index.genres.map((name, i) => [name, i]));
    const vector = new Float32Array(index.genres.length);
    for (const axis of AXES) {
      const value = mix[axis.key] / 100;
      for (const name of axis.low) {
        const i = map.get(name);
        if (i !== undefined) vector[i] += 1 - value;
      }
      for (const name of axis.high) {
        const i = map.get(name);
        if (i !== undefined) vector[i] += value;
      }
    }
    return vector;
  }, [index, mix]);

  const results = useMemo(() => {
    if (!index || !weights) return [];
    const scored: { item: (typeof index.items)[number]; score: number }[] = [];
    for (const item of index.items) {
      let score = 0;
      for (const g of item[5]) score += weights[g];
      if (score <= 0) continue;
      scored.push({ item, score });
      if (scored.length > 12000) break;
    }
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 60)
      .map(({ item }) => toCard(item, index.genres));
  }, [index, weights]);

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mood mixer</h1>
      <p className="mt-2 text-sm text-muted">
        Dial in how you feel. The catalogue re-ranks as you drag.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {AXES.map((axis) => (
          <label key={axis.key} className="block rounded-2xl bg-surface p-5 ring-1 ring-white/5">
            <div className="flex justify-between text-xs text-muted">
              <span>{axis.left}</span>
              <span>{axis.right}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={mix[axis.key]}
              onChange={(e) =>
                setMix((prev) => ({ ...prev, [axis.key]: Number(e.target.value) }))
              }
              className="mt-3 w-full accent-[var(--accent)]"
            />
          </label>
        ))}
      </div>

      {!index && <p className="mt-10 text-sm text-muted">Reading the room…</p>}

      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {results.map((item) => (
          <PosterCard key={item.i} item={item} />
        ))}
      </div>
    </div>
  );
}
