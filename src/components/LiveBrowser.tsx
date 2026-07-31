"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Shuffle, X } from "lucide-react";
import type { LiveChannel, LiveIndex } from "@/lib/types";
import {
  COUNTRY_NAMES,
  ChannelTile,
  LivePlayerOverlay,
  useZapKeys,
} from "./live-shared";

type Props = {
  categories: LiveIndex["categories"];
  countries: LiveIndex["countries"];
  initial: Record<string, LiveChannel[]>;
};

export function LiveBrowser({ categories, countries, initial }: Props) {
  // Local channels first: Australia, then other well-populated regions.
  const regions = [
    ...countries.filter((c) => c.code === "AU"),
    ...countries.filter((c) => c.code !== "AU" && COUNTRY_NAMES[c.code]),
  ].slice(0, 8);

  const [active, setActive] = useState(regions[0]?.slug ?? categories[0]?.slug ?? "");
  const [cache, setCache] = useState<Record<string, LiveChannel[]>>(initial);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<LiveChannel | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only start a feed once the pointer settles, so skimming the grid does not
  // open dozens of streams.
  const hover = useCallback((channel: LiveChannel | null) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (!channel) {
      setPreview(null);
      return;
    }
    hoverTimer.current = setTimeout(() => setPreview(channel.id), 550);
  }, []);

  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    []
  );

  const openCategory = useCallback(
    async (slug: string) => {
      setActive(slug);
      if (cache[slug]) return;
      setLoading(true);
      try {
        const res = await fetch(`/data/live/${slug}.json`);
        const data = (await res.json()) as { channels: LiveChannel[] };
        setCache((prev) => ({ ...prev, [slug]: data.channels }));
      } finally {
        setLoading(false);
      }
    },
    [cache]
  );

  const all = useMemo(() => cache[active] ?? [], [cache, active]);
  const [query, setQuery] = useState("");
  const channels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((c) => c.title.toLowerCase().includes(q)) : all;
  }, [all, query]);

  const tabsRef = useRef<HTMLDivElement>(null);
  const nudgeTabs = (direction: 1 | -1) =>
    tabsRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });

  useZapKeys(playing, channels, setPlaying, () => setPlaying(null));

  return (
    <>
      <div className="sticky top-[57px] z-30 -mx-4 mt-6 bg-[var(--bg)]/85 px-4 pb-3 pt-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => nudgeTabs(-1)}
            aria-label="Scroll categories left"
            className="hidden shrink-0 rounded-full bg-white/8 p-2 transition-colors hover:bg-white/16 sm:block"
          >
            <ChevronLeft size={16} />
          </button>
          <div
            ref={tabsRef}
            className="rail flex snap-x gap-2 overflow-x-auto scroll-smooth overscroll-x-contain pb-1"
          >
        {regions.map((region) => (
          <button
            key={region.slug}
            onClick={() => void openCategory(region.slug)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition-all hover:scale-105 ${
              active === region.slug
                ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-white"
                : "bg-white/8 text-muted hover:text-ink"
            }`}
          >
            {COUNTRY_NAMES[region.code] ?? region.code}
            <span className="ml-2 text-[11px] opacity-70">{region.count}</span>
          </button>
        ))}
        <span className="mx-1 w-px shrink-0 bg-white/10" />
        {categories.map((category) => (
          <button
            key={category.slug}
            onClick={() => void openCategory(category.slug)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition-all hover:scale-105 ${
              active === category.slug
                ? "bg-[var(--accent)] text-white"
                : "bg-white/8 text-muted hover:text-ink"
            }`}
          >
            {category.name}
            <span className="ml-2 text-[11px] opacity-70">{category.count}</span>
          </button>
        ))}
          </div>
          <button
            type="button"
            onClick={() => nudgeTabs(1)}
            aria-label="Scroll categories right"
            className="hidden shrink-0 rounded-full bg-white/8 p-2 transition-colors hover:bg-white/16 sm:block"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/8 px-4 py-2">
            <Search size={15} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter channels by name…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear filter"
                className="shrink-0 text-muted transition-colors hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <span className="hidden shrink-0 text-xs text-muted sm:inline">
            {channels.length.toLocaleString()} channels
          </span>
          <button
            type="button"
            disabled={!channels.length}
            onClick={() =>
              setPlaying(channels[Math.floor(Math.random() * channels.length)])
            }
            className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105 disabled:opacity-40"
          >
            <Shuffle size={14} /> Zap
          </button>
        </div>
      </div>

      {loading && <p className="mt-8 text-sm text-muted">Loading channels…</p>}
      {!loading && !channels.length && (
        <p className="mt-12 text-sm text-muted">No channels match “{query}”.</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {channels.map((channel) => (
          <ChannelTile
            key={channel.id}
            channel={channel}
            previewing={preview === channel.id}
            onOpen={() => setPlaying(channel)}
            onHover={hover}
          />
        ))}
      </div>

      {playing && (
        <LivePlayerOverlay
          playing={playing}
          channels={channels}
          onPlay={setPlaying}
          onClose={() => setPlaying(null)}
        />
      )}
    </>
  );
}
