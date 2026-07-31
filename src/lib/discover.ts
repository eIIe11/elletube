"use client";

export type DiscoverItem = [
  id: string,
  title: string,
  year: number,
  kind: string,
  runtime: number,
  genres: number[],
];

export type DiscoverIndex = { genres: string[]; items: DiscoverItem[] };

let cache: Promise<DiscoverIndex> | null = null;

/** Loads the compact discovery index once per session. */
export function loadDiscover(): Promise<DiscoverIndex> {
  cache ??= fetch("/data/discover.json").then(
    (res) => res.json() as Promise<DiscoverIndex>
  );
  return cache;
}

export function toCard(item: DiscoverItem, genreNames: string[]) {
  const kindMap: Record<string, "movie" | "series" | "documentary"> = {
    m: "movie",
    s: "series",
    d: "documentary",
  };
  return {
    i: item[0],
    t: item[1],
    y: item[2] || null,
    k: kindMap[item[3]] ?? "movie",
    r: item[4] || null,
    g: genreNames[item[5][0]] ?? "Open",
  };
}
