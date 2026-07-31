import type { Card } from "./types";

const KEY = "elletube:list";
const EVENT = "elletube:list-changed";

let snapshot: Card[] | null = null;
const EMPTY: Card[] = [];

function read(): Card[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Card[];
  } catch {
    return [];
  }
}

/** Stable snapshot so `useSyncExternalStore` doesn't loop. */
export function getList(): Card[] {
  if (typeof window === "undefined") return EMPTY;
  if (snapshot === null) snapshot = read();
  return snapshot;
}

export const getServerList = (): Card[] => EMPTY;

export function subscribe(onChange: () => void): () => void {
  const handler = () => {
    snapshot = read();
    onChange();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function isSaved(id: string): boolean {
  return getList().some((item) => item.i === id);
}

/** Adds or removes an item; returns the new saved state. */
export function toggleSaved(item: Card): boolean {
  const list = getList();
  const next = list.filter((entry) => entry.i !== item.i);
  const saved = next.length === list.length;
  if (saved) next.unshift(item);
  const trimmed = next.slice(0, 500);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  snapshot = trimmed;
  window.dispatchEvent(new Event(EVENT));
  return saved;
}
