"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Card as CardType } from "@/lib/types";

const KIND_LABEL: Record<string, string> = {
  movie: "Film",
  series: "Series",
  documentary: "Doc",
  live: "Live",
};

function runtimeLabel(minutes: number | null) {
  if (!minutes || minutes < 1) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function PosterCard({ item, eager = false }: { item: CardType; eager?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [near, setNear] = useState(eager);

  // Rails render every card up front, and `loading="lazy"` does not help inside
  // a horizontal scroller — the browser fires every request at once and the
  // connection pool to archive.org saturates. Only mount images near the
  // viewport.
  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);

  // Pointer-driven 3D tilt, written straight to the transform (no re-render).
  function tilt(e: React.PointerEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${
      -py * 12
    }deg) scale(1.06)`;
  }

  function reset() {
    const el = ref.current;
    if (el) el.style.transform = "";
  }

  return (
    <Link
      ref={ref}
      href={`/title/${encodeURIComponent(item.i)}`}
      onPointerMove={tilt}
      onPointerLeave={reset}
      onBlur={reset}
      className="group relative block w-[150px] shrink-0 transition-transform duration-200 ease-out will-change-transform sm:w-[176px]"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface ring-1 ring-white/5 transition-shadow duration-300 group-hover:shadow-[0_18px_50px_-12px_rgba(255,45,111,0.45)] group-hover:ring-white/20">
        {!loaded && <div className="skeleton absolute inset-0" />}
        {near && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://archive.org/services/img/${encodeURIComponent(item.i)}`}
            alt=""
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute left-2 top-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/85 backdrop-blur">
          {KIND_LABEL[item.k] ?? item.k}
        </span>
        <div className="absolute inset-x-2 bottom-2 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-black">
            ▶ Play
          </span>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink/90">
          {item.t}
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          {[item.y, runtimeLabel(item.r), item.g].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}
