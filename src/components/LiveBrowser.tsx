"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { LiveChannel, LiveIndex } from "@/lib/types";
import { channelSource } from "@/lib/availability";
import { Player } from "./Player";
import { RegionGate } from "./RegionNotice";

type Props = {
  categories: LiveIndex["categories"];
  countries: LiveIndex["countries"];
  initial: Record<string, LiveChannel[]>;
};

const COUNTRY_NAMES: Record<string, string> = {
  AU: "Australia",
  NZ: "New Zealand",
  GB: "United Kingdom",
  US: "United States",
  CA: "Canada",
  IE: "Ireland",
  IN: "India",
  TH: "Thailand",
  SG: "Singapore",
  ZA: "South Africa",
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

  const channels = useMemo(() => cache[active] ?? [], [cache, active]);

  // Zap: arrow keys surf channels inside the player, Z jumps somewhere random.
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPlaying(null);
        return;
      }
      if (!channels.length) return;
      const current = channels.findIndex((c) => c.id === playing.id);
      if (e.key === "ArrowRight" || e.key === "]") {
        e.preventDefault();
        setPlaying(channels[(current + 1) % channels.length]);
      } else if (e.key === "ArrowLeft" || e.key === "[") {
        e.preventDefault();
        setPlaying(channels[(current - 1 + channels.length) % channels.length]);
      } else if (e.key.toLowerCase() === "z") {
        setPlaying(channels[Math.floor(Math.random() * channels.length)]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, channels]);

  return (
    <>
      <div className="rail mt-7 flex gap-2 overflow-x-auto pb-2">
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

      {loading && <p className="mt-8 text-sm text-muted">Loading channels…</p>}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => setPlaying(channel)}
            className="group flex flex-col items-center gap-3 rounded-2xl bg-surface p-4 ring-1 ring-white/5 transition-all duration-200 hover:-translate-y-1 hover:ring-white/20"
          >
            <div className="flex h-14 w-full items-center justify-center">
              {channel.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={channel.logo}
                  alt=""
                  loading="lazy"
                  className="max-h-14 max-w-full object-contain transition-transform duration-200 group-hover:scale-110"
                />
              ) : (
                <span className="text-2xl font-semibold text-muted">
                  {channel.title.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="line-clamp-2 text-center text-xs text-ink/85">
              {channel.title}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted">
              {[channel.country, channel.height ? `${channel.height}p` : ""]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </button>
        ))}
      </div>

      {playing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl">
          <div className="w-full max-w-5xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
                <h2 className="text-sm font-semibold">{playing.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-[11px] text-muted sm:inline">
                  ← → zap · Z random · Esc close
                </span>
                <button
                  onClick={() =>
                    setPlaying(channels[Math.floor(Math.random() * channels.length)])
                  }
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs transition-colors hover:bg-white/20"
                >
                  Zap
                </button>
                <button
                  onClick={() => setPlaying(null)}
                  aria-label="Close player"
                  className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <RegionGate source={channelSource(playing)}>
              <Player src={playing.url} title={playing.title} live />
            </RegionGate>
          </div>
        </div>
      )}
    </>
  );
}
