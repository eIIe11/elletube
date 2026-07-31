"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  getServerPreferences,
  setPreferences,
  subscribe,
  type Preferences,
} from "@/lib/preferences";
import type { GenreSummary } from "@/lib/types";

export default function PreferencesPage() {
  const prefs = useSyncExternalStore(subscribe, getPreferences, getServerPreferences);
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    void fetch("/data/genres.json")
      .then((res) => res.json() as Promise<GenreSummary[]>)
      .then((list) => setGenres(list.map((g) => g.name)));
  }, []);

  const update = (patch: Partial<Preferences>) =>
    setPreferences({ ...prefs, ...patch });

  const toggle = (key: "hidden" | "boosted", name: string) =>
    update({
      [key]: prefs[key].includes(name)
        ? prefs[key].filter((g) => g !== name)
        : [...prefs[key], name],
    });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Preferences</h1>
      <p className="mt-2 text-sm text-muted">
        Stored on this device only. Nothing is sent anywhere.
      </p>

      <section className="mt-10">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={prefs.englishOnly}
            onChange={(e) => update({ englishOnly: e.target.checked })}
            className="mt-1 h-4 w-4 accent-[var(--accent)]"
          />
          <span>
            <span className="text-sm font-medium">English-language only</span>
            <span className="mt-0.5 block text-xs text-muted">
              Hides foreign-language titles, except critically acclaimed ones.
            </span>
          </span>
        </label>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold">Never show</h2>
        <p className="mt-1 text-xs text-muted">
          These categories disappear from rails, browse, search and shuffles.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {genres.map((name) => (
            <button
              key={name}
              onClick={() => toggle("hidden", name)}
              className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                prefs.hidden.includes(name)
                  ? "bg-[var(--accent)] text-white"
                  : "bg-white/8 text-muted hover:text-ink"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold">Show me more of</h2>
        <p className="mt-1 text-xs text-muted">
          These get pushed to the top of everything.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {genres.map((name) => (
            <button
              key={name}
              onClick={() => toggle("boosted", name)}
              className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                prefs.boosted.includes(name)
                  ? "bg-[var(--accent-2)] text-white"
                  : "bg-white/8 text-muted hover:text-ink"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={() => setPreferences(DEFAULT_PREFERENCES)}
        className="mt-12 rounded-full bg-white/8 px-5 py-2.5 text-sm transition-colors hover:bg-white/15"
      >
        Reset to defaults
      </button>
    </div>
  );
}
