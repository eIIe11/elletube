"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Info, Play } from "lucide-react";
import type { SpotlightCard } from "@/lib/types";

export function Hero({ items }: { items: SpotlightCard[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % items.length),
      9000
    );
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;
  const item = items[index];

  return (
    <section className="relative h-[62vh] min-h-[420px] w-full overflow-hidden sm:h-[74vh]">
      {items.map((entry, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={entry.i}
          src={`https://archive.org/services/img/${encodeURIComponent(entry.i)}`}
          alt=""
          aria-hidden={i !== index}
          // Source art is tiny, so it is treated as a deliberate blurred wash
          // rather than presented as a sharp backdrop.
          className={`absolute inset-0 h-full w-full scale-110 object-cover blur-2xl saturate-150 transition-opacity duration-1000 ${
            i === index ? "opacity-60" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" />

      <div key={item.i} className="fade-up absolute bottom-10 left-0 max-w-2xl px-4 sm:bottom-16 sm:px-8">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted">
          {item.gs.map((genre) => (
            <span key={genre} className="rounded-full bg-white/10 px-2.5 py-1">
              {genre}
            </span>
          ))}
          {item.y && <span>{item.y}</span>}
        </div>
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {item.t}
        </h1>
        <p className="mt-3 line-clamp-3 max-w-xl text-sm text-ink/70 sm:text-base">
          {item.o}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/watch/${encodeURIComponent(item.i)}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
          >
            <Play size={17} fill="currentColor" /> Play
          </Link>
          <Link
            href={`/title/${encodeURIComponent(item.i)}`}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-7 py-3 text-sm font-semibold backdrop-blur transition-transform hover:scale-105 hover:bg-white/20 active:scale-95"
          >
            <Info size={17} /> More info
          </Link>
        </div>

        <div className="mt-7 flex gap-1.5">
          {items.map((entry, i) => (
            <button
              key={entry.i}
              onClick={() => setIndex(i)}
              aria-label={`Show ${entry.t}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-[var(--accent)]" : "w-3 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
