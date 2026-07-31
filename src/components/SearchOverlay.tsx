"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type Entry = [id: string, title: string, year: number, kind: string];
type Index = { vod: Entry[]; live: Entry[] };

const KIND_LABEL: Record<string, string> = {
  m: "Film",
  s: "Series",
  d: "Doc",
  l: "Live",
};

function score(title: string, query: string) {
  const t = title.toLowerCase();
  const i = t.indexOf(query);
  if (i === -1) return -1;
  return (i === 0 ? 1000 : 500 - i) - Math.min(t.length, 200) * 0.4;
}

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<Index | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (index || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/data/search.json");
      setIndex((await res.json()) as Index);
    } finally {
      setLoading(false);
    }
  }, [index, loading]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typingInField =
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName);
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && !typingInField) {
        e.preventDefault();
        setOpen(true);
        void load();
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [load]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!index || q.length < 2) return [];
    const out: { entry: Entry; s: number; live: boolean }[] = [];
    for (const entry of index.vod) {
      const s = score(entry[1], q);
      if (s > 0) out.push({ entry, s, live: false });
      if (out.length > 4000) break;
    }
    for (const entry of index.live) {
      const s = score(entry[1], q);
      if (s > 0) out.push({ entry, s, live: true });
    }
    return out.sort((a, b) => b.s - a.s).slice(0, 40);
  }, [index, query]);

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          void load();
        }}
        aria-label="Search"
        className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-2 text-sm text-muted transition-colors hover:bg-white/15 hover:text-ink"
      >
        <Search size={16} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="ml-2 hidden rounded border border-white/15 px-1.5 text-[10px] text-muted sm:inline">
          /
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] bg-bg/85 backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-3xl flex-col px-4 pt-[12vh]">
            <div className="fade-up flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 ring-1 ring-white/10">
              <Search size={20} className="text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 44,000+ titles and live channels…"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted"
              />
              <button onClick={() => setOpen(false)} aria-label="Close search">
                <X size={20} className="text-muted transition-colors hover:text-ink" />
              </button>
            </div>

            <div className="scroll-thin mt-4 flex-1 overflow-y-auto pb-10">
              {loading && <p className="p-4 text-sm text-muted">Loading index…</p>}
              {!loading && query.trim().length < 2 && (
                <p className="p-4 text-sm text-muted">
                  Type at least two characters. Esc to close.
                </p>
              )}
              {!loading && query.trim().length >= 2 && !results.length && (
                <p className="p-4 text-sm text-muted">No matches.</p>
              )}
              <ul className="space-y-1">
                {results.map(({ entry, live }) => (
                  <li key={`${live ? "l" : "v"}-${entry[0]}`}>
                    <Link
                      href={
                        live
                          ? `/live?channel=${encodeURIComponent(entry[0])}`
                          : `/title/${encodeURIComponent(entry[0])}`
                      }
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/8"
                    >
                      <span className="truncate text-sm">{entry[1]}</span>
                      <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted">
                        {[KIND_LABEL[entry[3]] ?? "", entry[2] || ""]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
