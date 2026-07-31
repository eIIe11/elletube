"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Card as CardType } from "@/lib/types";
import {
  applyPreferences,
  getPreferences,
  getServerPreferences,
  subscribe,
} from "@/lib/preferences";
import { PosterCard } from "./Card";

export function Rail({
  title,
  href,
  items,
  eager = false,
}: {
  title: string;
  href?: string;
  items: CardType[];
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const prefs = useSyncExternalStore(subscribe, getPreferences, getServerPreferences);
  const visible = useMemo(() => applyPreferences(items, prefs), [items, prefs]);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    measure();
  }, [measure, visible]);

  function nudge(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  if (!visible.length) return null;

  return (
    <section className="group/rail relative py-4">
      <div className="mb-2 flex items-baseline justify-between px-4 sm:px-8">
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
        {href && (
          <Link
            href={href}
            className="text-xs text-muted transition-colors hover:text-ink"
          >
            See all →
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          ref={ref}
          onScroll={measure}
          className="rail flex gap-3 overflow-x-auto px-4 pb-2 sm:px-8"
        >
          {visible.map((item, index) => (
            <PosterCard key={item.i} item={item} eager={eager && index < 6} />
          ))}
        </div>

        {!edges.start && (
          <RailButton side="left" onClick={() => nudge(-1)} />
        )}
        {!edges.end && <RailButton side="right" onClick={() => nudge(1)} />}
      </div>
    </section>
  );
}

function RailButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      className={`absolute top-0 hidden h-[calc(100%-0.5rem)] w-14 items-center justify-center bg-gradient-to-${
        side === "left" ? "r" : "l"
      } from-bg to-transparent opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 sm:flex ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-transform hover:scale-110 active:scale-95">
        <Icon size={20} />
      </span>
    </button>
  );
}
