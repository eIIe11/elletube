"use client";

import { useSyncExternalStore } from "react";
import { Check, Plus } from "lucide-react";
import type { Card } from "@/lib/types";
import { getList, getServerList, subscribe, toggleSaved } from "@/lib/watchlist";

export function WatchlistButton({ item }: { item: Card }) {
  const list = useSyncExternalStore(subscribe, getList, getServerList);
  const saved = list.some((entry) => entry.i === item.i);

  return (
    <button
      onClick={() => toggleSaved(item)}
      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur transition-all hover:scale-105 hover:bg-white/20 active:scale-95"
    >
      {saved ? <Check size={17} /> : <Plus size={17} />}
      {saved ? "In My List" : "My List"}
    </button>
  );
}
