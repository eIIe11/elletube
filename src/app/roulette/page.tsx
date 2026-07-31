"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";
import { loadDiscover, toCard, type DiscoverIndex } from "@/lib/discover";
import type { Card } from "@/lib/types";

/** Slot-machine picker: spins posters, lands on one, auto-plays after a countdown. */
export default function RoulettePage() {
  const [index, setIndex] = useState<DiscoverIndex | null>(null);
  const [reel, setReel] = useState<Card | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    void loadDiscover().then(setIndex);
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, []);

  const spin = useCallback(() => {
    if (!index || spinning) return;
    setSpinning(true);
    setCountdown(null);

    const pick = () =>
      toCard(index.items[Math.floor(Math.random() * index.items.length)], index.genres);

    let elapsed = 0;
    const tick = () => {
      setReel(pick());
      elapsed += 1;
      if (elapsed < 22) {
        timers.current.push(window.setTimeout(tick, 40 + elapsed * 9));
      } else {
        setSpinning(false);
        setCountdown(5);
      }
    };
    tick();
  }, [index, spinning]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) return;
    const id = window.setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  const shouldPlay = countdown === 0 && reel;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora absolute left-1/4 top-1/4 h-[60vh] w-[60vw] rounded-full bg-[var(--accent-2)]/15 blur-[160px]" />
      </div>

      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Roulette</h1>
      <p className="mt-2 text-center text-sm text-muted">
        Can&apos;t decide? Let the reel decide for you.
      </p>

      <div className="relative mt-10 h-[330px] w-[220px] overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10">
        {reel ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={reel.i}
            src={`https://archive.org/services/img/${encodeURIComponent(reel.i)}`}
            alt=""
            className={`h-full w-full object-cover ${spinning ? "blur-[2px]" : "fade-up"}`}
          />
        ) : (
          <div className="skeleton h-full w-full" />
        )}
      </div>

      {reel && !spinning && (
        <div className="fade-up mt-6 max-w-md text-center">
          <p className="text-lg font-semibold">{reel.t}</p>
          <p className="mt-1 text-xs text-muted">
            {[reel.y, reel.g].filter(Boolean).join(" · ")}
          </p>
          {countdown !== null && countdown > 0 && (
            <p className="mt-3 text-sm text-[var(--accent)]">
              Playing in {countdown}…
            </p>
          )}
          {shouldPlay && (
            <Link
              href={`/watch/${encodeURIComponent(reel.i)}`}
              className="mt-4 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black"
            >
              Open player
            </Link>
          )}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <button
          onClick={spin}
          disabled={!index || spinning}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-8 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Dices size={18} className={spinning ? "animate-spin" : ""} />
          {spinning ? "Spinning…" : "Spin"}
        </button>
        {reel && !spinning && (
          <Link
            href={`/title/${encodeURIComponent(reel.i)}`}
            className="rounded-full bg-white/10 px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-105"
          >
            Details
          </Link>
        )}
      </div>
    </div>
  );
}
