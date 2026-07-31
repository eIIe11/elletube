"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Card as CardType } from "@/lib/types";
import {
  applyPreferences,
  getPreferences,
  getServerPreferences,
  subscribe,
} from "@/lib/preferences";
import { PosterCard } from "./Card";

export function CardGrid({ items }: { items: CardType[] }) {
  const prefs = useSyncExternalStore(subscribe, getPreferences, getServerPreferences);
  const visible = useMemo(() => applyPreferences(items, prefs), [items, prefs]);

  if (!visible.length) {
    return (
      <p className="mt-12 text-sm text-muted">
        Everything here is filtered out by your preferences.
      </p>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-4">
      {visible.map((item, index) => (
        <PosterCard key={item.i} item={item} eager={index < 12} />
      ))}
    </div>
  );
}
