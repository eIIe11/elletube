"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadDiscover, toCard, type DiscoverIndex } from "@/lib/discover";
import type { Card } from "@/lib/types";

const POCKETS = 37;
const SEGMENT = 360 / POCKETS;

/** European wheel order, so the numbers read like the real thing. */
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const REDS = new Set([
  32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3,
]);

function pocketFill(value: number) {
  if (value === 0) return "#0f7a4a";
  return REDS.has(value) ? "#b3123a" : "#15151d";
}

/** Wedge path for one pocket on a circle of radius `r` centred at (cx, cy). */
function wedge(index: number, r: number, cx: number, cy: number) {
  const start = ((index * SEGMENT - 90 - SEGMENT / 2) * Math.PI) / 180;
  const end = ((index * SEGMENT - 90 + SEGMENT / 2) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

/** A real wheel: it spins down under friction and drops into a numbered pocket. */
export default function RoulettePage() {
  const [index, setIndex] = useState<DiscoverIndex | null>(null);
  const [result, setResult] = useState<{ card: Card; pocket: number } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const settleTimer = useRef<number | null>(null);

  useEffect(() => {
    void loadDiscover().then(setIndex);
    return () => {
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
    };
  }, []);

  const spin = useCallback(() => {
    if (!index || spinning) return;
    setSpinning(true);
    setResult(null);
    setCountdown(null);

    const slot = Math.floor(Math.random() * POCKETS);
    const card = toCard(
      index.items[Math.floor(Math.random() * index.items.length)],
      index.genres
    );

    // Land the chosen pocket under the pointer at 12 o'clock, after 6 full turns.
    const target =
      Math.ceil(rotation / 360) * 360 + 360 * 6 + (360 - slot * SEGMENT);
    setRotation(target);

    settleTimer.current = window.setTimeout(() => {
      setSpinning(false);
      setResult({ card, pocket: WHEEL_ORDER[slot] });
      setCountdown(5);
    }, 5200);
  }, [index, spinning, rotation]);

  useEffect(() => {
    if (countdown === null || countdown === 0) return;
    const id = window.setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  const pockets = useMemo(
    () =>
      WHEEL_ORDER.map((value, i) => ({
        value,
        i,
        path: wedge(i, 150, 160, 160),
        // Label sits three-quarters out along the wedge's centre line.
        lx: 160 + 122 * Math.cos(((i * SEGMENT - 90) * Math.PI) / 180),
        ly: 160 + 122 * Math.sin(((i * SEGMENT - 90) * Math.PI) / 180),
      })),
    []
  );

  const card = result?.card;

  return (
    <div className="flex min-h-[80vh] flex-col items-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora absolute left-1/4 top-1/4 h-[60vh] w-[60vw] rounded-full bg-[var(--accent-2)]/15 blur-[160px]" />
      </div>

      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Roulette</h1>
      <p className="mt-2 text-center text-sm text-muted">
        Spin the wheel and watch it drop. Whatever number it lands on picks your film.
      </p>

      <div className="relative mt-10 h-[320px] w-[320px]">
        {/* Pointer */}
        <div className="absolute left-1/2 top-[-6px] z-10 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[18px] border-x-transparent border-t-white drop-shadow" />

        <svg
          viewBox="0 0 320 320"
          className="h-full w-full drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 5.2s cubic-bezier(0.12, 0.72, 0.12, 1)"
              : undefined,
          }}
        >
          <circle cx="160" cy="160" r="156" fill="#241a12" />
          {pockets.map((pocket) => (
            <path
              key={pocket.i}
              d={pocket.path}
              fill={pocketFill(pocket.value)}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="0.6"
            />
          ))}
          {pockets.map((pocket) => (
            <text
              key={`t-${pocket.i}`}
              x={pocket.lx}
              y={pocket.ly}
              fill="white"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${pocket.i * SEGMENT} ${pocket.lx} ${pocket.ly})`}
            >
              {pocket.value}
            </text>
          ))}
          <circle cx="160" cy="160" r="82" fill="#1a1208" stroke="rgba(255,255,255,0.12)" />
          <circle cx="160" cy="160" r="54" fill="#0f0b06" />
          <circle cx="160" cy="160" r="10" fill="#c9a227" />
        </svg>
      </div>

      {result && card && (
        <div className="fade-up mt-8 flex max-w-md flex-col items-center text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ring-2 ring-white/25"
            style={{ background: pocketFill(result.pocket) }}
          >
            {result.pocket}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://archive.org/services/img/${encodeURIComponent(card.i)}`}
            alt=""
            className="mt-4 aspect-video w-[260px] rounded-xl object-cover ring-1 ring-white/10"
          />
          <p className="mt-3 text-lg font-semibold">{card.t}</p>
          <p className="mt-1 text-xs text-muted">
            {[card.y, card.g].filter(Boolean).join(" · ")}
          </p>
          {countdown !== null && countdown > 0 && (
            <p className="mt-3 text-sm text-[var(--accent)]">Playing in {countdown}…</p>
          )}
          {countdown === 0 && (
            <Link
              href={`/watch/${encodeURIComponent(card.i)}`}
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
          className="rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-10 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {spinning ? "No more bets…" : "Spin"}
        </button>
        {card && !spinning && (
          <Link
            href={`/title/${encodeURIComponent(card.i)}`}
            className="rounded-full bg-white/10 px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-105"
          >
            Details
          </Link>
        )}
      </div>
    </div>
  );
}
