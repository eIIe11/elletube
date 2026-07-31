"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { LiveChannel } from "@/lib/types";
import { channelSource } from "@/lib/availability";
import { Player } from "./Player";
import { RegionGate } from "./RegionNotice";

export const COUNTRY_NAMES: Record<string, string> = {
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
export function LivePreview({ url }: { url: string }) {
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

export function ChannelTile({
  channel,
  previewing,
  onOpen,
  onHover,
}: {
  channel: LiveChannel;
  previewing: boolean;
  onOpen: () => void;
  onHover: (channel: LiveChannel | null) => void;
}) {
  return (
    <button
      onClick={onOpen}
      onPointerEnter={() => onHover(channel)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(channel)}
      onBlur={() => onHover(null)}
      className="group overflow-hidden rounded-2xl bg-surface text-left ring-1 ring-white/5 transition-all duration-200 hover:-translate-y-1 hover:ring-white/25"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black/50">
        {previewing ? (
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
        {channel.geo && (
          <span
            title={`Only plays from inside ${
              COUNTRY_NAMES[channel.country] ?? channel.country
            }`}
            className="absolute bottom-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur"
          >
            {channel.country} only
          </span>
        )}
        {channel.height >= 720 && (
          <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur">
            {channel.height >= 1080 ? "HD" : "720p"}
          </span>
        )}
      </div>
      <div className="px-3 pb-3 pt-2.5">
        <p className="line-clamp-1 text-sm font-medium text-ink/95">{channel.title}</p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">
          {[COUNTRY_NAMES[channel.country] ?? channel.country, channel.genres[0]]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </button>
  );
}

/** Full-screen player with a channel strip so you can surf without closing it. */
export function LivePlayerOverlay({
  playing,
  channels,
  onPlay,
  onClose,
}: {
  playing: LiveChannel;
  channels: LiveChannel[];
  onPlay: (channel: LiveChannel) => void;
  onClose: () => void;
}) {
  return (
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
              onClick={() => onPlay(channels[Math.floor(Math.random() * channels.length)])}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs transition-colors hover:bg-white/20"
            >
              Zap
            </button>
            <button
              onClick={onClose}
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

        <div className="rail mt-4 flex snap-x gap-2 overflow-x-auto scroll-smooth pb-1">
          {channels.slice(0, 60).map((channel) => (
            <button
              key={channel.id}
              onClick={() => onPlay(channel)}
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
  );
}

/** Arrow keys surf, Z jumps somewhere random, Esc closes. */
export function useZapKeys(
  playing: LiveChannel | null,
  channels: LiveChannel[],
  onPlay: (channel: LiveChannel) => void,
  onClose: () => void
) {
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (!channels.length) return;
      const current = channels.findIndex((c) => c.id === playing.id);
      if (e.key === "ArrowRight" || e.key === "]") {
        e.preventDefault();
        onPlay(channels[(current + 1) % channels.length]);
      } else if (e.key === "ArrowLeft" || e.key === "[") {
        e.preventDefault();
        onPlay(channels[(current - 1 + channels.length) % channels.length]);
      } else if (e.key.toLowerCase() === "z") {
        onPlay(channels[Math.floor(Math.random() * channels.length)]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, channels, onPlay, onClose]);
}
