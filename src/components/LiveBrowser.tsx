"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Shuffle, X } from "lucide-react";
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

/**
 * Muted, low-latency peek at the feed while the pointer rests on a tile. It is
 * deliberately not the full Player: no controls, no resume, torn down on leave.
 */
function LivePreview({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let destroy = () => {};

    if (video.canPlayType("application/vnd.apple.mpegurl") || !url.includes(".m3u8")) {
      video.src = url;
      void video.play().catch(() => {});
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled || !Hls.isSupported()) return;
        const hls = new Hls({ maxBufferLength: 6, liveSyncDurationCount: 1 });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => void video.play().catch(() => {}));
        destroy = () => hls.destroy();
      });
    }

    return () => {
      cancelled = true;
      destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [url]);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      className="absolute inset-0 h-full w-full rounded-2xl object-cover opacity-0 transition-opacity duration-500 [&[data-ready]]:opacity-100"
      onPlaying={(e) => e.currentTarget.setAttribute("data-ready", "")}
    />
  );
}

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
          <button
            key={channel.id}
            onClick={() => setPlaying(channel)}
            onPointerEnter={() => hover(channel)}
            onPointerLeave={() => hover(null)}
            onFocus={() => hover(channel)}
            onBlur={() => hover(null)}
            className="group overflow-hidden rounded-2xl bg-surface text-left ring-1 ring-white/5 transition-all duration-200 hover:-translate-y-1 hover:ring-white/25"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-black/50">
              {preview === channel.id ? (
                <>
                  <LivePreview url={channel.url} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </>
              ) : channel.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={channel.logo}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 m-auto max-h-[60%] max-w-[70%] object-contain transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-semibold text-white/40">
                  {channel.title.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                Live
              </span>
              {channel.height >= 720 && (
                <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur">
                  {channel.height >= 1080 ? "HD" : "720p"}
                </span>
              )}
            </div>
            <div className="px-3 pb-3 pt-2.5">
              <p className="line-clamp-1 text-sm font-medium text-ink/95">
                {channel.title}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">
                {[
                  COUNTRY_NAMES[channel.country] ?? channel.country,
                  channel.genres[0],
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </button>
        ))}
      </div>

      {playing && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-center bg-black/92 p-4 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-5xl">
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

            {/* Channel strip: surf without leaving the player. */}
            <div className="rail mt-4 flex snap-x gap-2 overflow-x-auto scroll-smooth pb-1">
              {channels.slice(0, 60).map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setPlaying(channel)}
                  className={`flex w-[132px] shrink-0 flex-col items-center gap-1.5 rounded-xl p-2 transition-colors ${
                    channel.id === playing.id
                      ? "bg-white/16 ring-1 ring-[var(--accent)]"
                      : "bg-white/6 hover:bg-white/12"
                  }`}
                >
                  <div className="flex h-8 items-center">
                    {channel.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={channel.logo}
                        alt=""
                        loading="lazy"
                        className="max-h-8 max-w-[100px] object-contain"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-muted">
                        {channel.title.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="line-clamp-1 w-full text-center text-[11px] text-ink/80">
                    {channel.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
