"use client";

import type { Card } from "./types";

export type Preferences = {
  /** Show English-language titles only, keeping acclaimed exceptions. */
  englishOnly: boolean;
  /** Categories the viewer never wants to see. */
  hidden: string[];
  /** Categories pushed to the top of ranked results. */
  boosted: string[];
};

export const DEFAULT_PREFERENCES: Preferences = {
  englishOnly: true,
  hidden: ["Action"],
  boosted: ["Cult Classics", "World Cinema", "Open Movies", "Short Films"],
};

const KEY = "elletube:prefs";

let cached: Preferences | null = null;
const listeners = new Set<() => void>();

function read(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  cached ??= read();
  return cached;
}

export function getServerPreferences(): Preferences {
  return DEFAULT_PREFERENCES;
}

export function setPreferences(next: Preferences) {
  cached = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

/**
 * Non-Latin scripts and the romanised markers that reliably indicate a title
 * is not in English. Foreign-language titles are demoted, not deleted: an
 * acclaimed one still surfaces via `isAcclaimed`.
 */
const NON_ENGLISH =
  /[\u0400-\u04ff\u0590-\u05ff\u0600-\u06ff\u0900-\u097f\u0e00-\u0e7f\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;

const FOREIGN_MARKER =
  /\b(subtitulad[oa]|sous-titr|con subt[ií]tulos|legendado|dublado|hindi|telugu|tamil|marathi|bengali|punjabi|urdu|mandarin|cantonese|thai|korean|japanese|vietnamese|indonesian|tagalog|eng ?sub(bed|s)?|hardsub(bed)?|dub(bed)? in)\b/i;

export function looksEnglish(title: string): boolean {
  return !NON_ENGLISH.test(title) && !FOREIGN_MARKER.test(title);
}

/** Long-running, heavily watched titles earn an exemption from the filter. */
export function isAcclaimed(card: Card): boolean {
  return (card.r ?? 0) >= 85;
}

export function allow(card: Card, prefs: Preferences): boolean {
  if (card.g && prefs.hidden.includes(card.g)) return false;
  if (prefs.englishOnly && !looksEnglish(card.t) && !isAcclaimed(card)) {
    return false;
  }
  return true;
}

export function applyPreferences(cards: Card[], prefs: Preferences): Card[] {
  const kept = cards.filter((card) => allow(card, prefs));
  if (!prefs.boosted.length) return kept;
  return kept
    .map((card, i) => ({ card, i, boost: card.g && prefs.boosted.includes(card.g) ? 1 : 0 }))
    .sort((a, b) => b.boost - a.boost || a.i - b.i)
    .map((entry) => entry.card);
}
