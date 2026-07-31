"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Shuffle, X } from "lucide-react";
import type { LiveChannel } from "@/lib/types";
import { ChannelTile, LivePlayerOverlay, useZapKeys } from "./live-shared";

export type NetworkGroup = { name: string; channels: LiveChannel[] };

/** Australia's own surface: channels grouped by broadcaster, not by genre. */
export function AustraliaLive({ groups }: { groups: NetworkGroup[] }) {
  const [playing, setPlaying] = useState<LiveChannel | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        channels: group.channels.filter((c) => c.title.toLowerCase().includes(q)),
      }))
      .filter((group) => group.channels.length);
  }, [groups, query]);

  const flat = useMemo(() => filtered.flatMap((g) => g.channels), [filtered]);

  useZapKeys(playing, flat, setPlaying, () => setPlaying(null));

  return (
    <>
      <div className="sticky top-[57px] z-30 -mx-4 mt-6 flex items-center gap-3 bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/8 px-4 py-2">
          <Search size={15} className="shrink-0 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find an Australian channel…"
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
        <button
          type="button"
          disabled={!flat.length}
          onClick={() => setPlaying(flat[Math.floor(Math.random() * flat.length)])}
          className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105 disabled:opacity-40"
        >
          <Shuffle size={14} /> Zap
        </button>
      </div>

      {!flat.length && (
        <p className="mt-12 text-sm text-muted">No Australian channel matches “{query}”.</p>
      )}

      {filtered.map((group) => (
        <section key={group.name} className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">
            {group.name}
            <span className="ml-2 text-sm font-normal text-muted">
              {group.channels.length}
            </span>
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {group.channels.map((channel) => (
              <ChannelTile
                key={channel.id}
                channel={channel}
                previewing={preview === channel.id}
                onOpen={() => setPlaying(channel)}
                onHover={hover}
              />
            ))}
          </div>
        </section>
      ))}

      {playing && (
        <LivePlayerOverlay
          playing={playing}
          channels={flat}
          onPlay={setPlaying}
          onClose={() => setPlaying(null)}
        />
      )}
    </>
  );
}
