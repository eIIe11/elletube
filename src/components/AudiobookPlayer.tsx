"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import type { AudioTrack } from "@/lib/archive";

type Position = { index: number; time: number };

const NONE: Position = { index: 0, time: 0 };
const cache = new Map<string, Position>();

/** Stable snapshot so `useSyncExternalStore` doesn't loop. */
function readPosition(key: string): Position {
  if (typeof window === "undefined") return NONE;
  const hit = cache.get(key);
  if (hit) return hit;
  let value = NONE;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) value = JSON.parse(raw) as Position;
  } catch {
    value = NONE;
  }
  cache.set(key, value);
  return value;
}

function label(seconds: number | null) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Listening position is per-book, kept on the device only. */
export function AudiobookPlayer({ id, tracks }: { id: string; tracks: AudioTrack[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const key = `bootube:listen:${id}`;

  const saved = useSyncExternalStore(
    useCallback(() => () => {}, []),
    useCallback(() => readPosition(key), [key]),
    useCallback(() => NONE, [])
  );

  const [override, setOverride] = useState<number | null>(null);
  const index =
    override ?? (saved.index < tracks.length ? saved.index : 0);

  function setIndex(next: number) {
    setOverride(next);
  }

  function onLoaded() {
    const el = audioRef.current;
    if (!el) return;
    if (override === null && saved.index === index && saved.time > 5) {
      el.currentTime = saved.time;
    }
  }

  function onTime() {
    const el = audioRef.current;
    if (!el) return;
    const position = { index, time: el.currentTime };
    cache.set(key, position);
    window.localStorage.setItem(key, JSON.stringify(position));
  }

  function onEnded() {
    if (index + 1 < tracks.length) setIndex(index + 1);
  }

  const current = tracks[index];
  if (!current) return null;

  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-white/5">
      <p className="text-sm font-medium">{current.title}</p>
      <audio
        ref={audioRef}
        src={current.url}
        controls
        autoPlay={index > 0}
        onLoadedMetadata={onLoaded}
        onTimeUpdate={onTime}
        onEnded={onEnded}
        className="mt-3 w-full"
      />
      {tracks.length > 1 && (
        <ol className="mt-4 max-h-72 space-y-1 overflow-y-auto text-sm">
          {tracks.map((track, i) => (
            <li key={track.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                  i === index ? "bg-white/12 text-ink" : "text-muted hover:bg-white/6"
                }`}
              >
                <span className="line-clamp-1">
                  {i + 1}. {track.title}
                </span>
                <span className="shrink-0 text-xs">{label(track.seconds)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
