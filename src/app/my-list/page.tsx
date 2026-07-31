"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { PosterCard } from "@/components/Card";
import { getList, getServerList, subscribe } from "@/lib/watchlist";

export default function MyListPage() {
  const items = useSyncExternalStore(subscribe, getList, getServerList);

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">My List</h1>
      <p className="mt-2 text-sm text-muted">
        Saved locally on this device — no account, no tracking.
      </p>

      {!items.length && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted">Nothing saved yet.</p>
          <Link
            href="/browse"
            className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium transition-transform hover:scale-105"
          >
            Browse the catalogue
          </Link>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {items.map((item) => (
          <PosterCard key={item.i} item={item} />
        ))}
      </div>
    </div>
  );
}
