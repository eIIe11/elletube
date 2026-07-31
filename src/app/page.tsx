import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Rail } from "@/components/Rail";
import { getGenres, getHome, getLiveIndex } from "@/lib/catalog";

export const revalidate = 3600;

export default async function HomePage() {
  const [home, genres, live] = await Promise.all([
    getHome(),
    getGenres(),
    getLiveIndex(),
  ]);

  return (
    <>
      <Hero items={home.spotlight} />

      <div className="relative z-10 -mt-10">
        <Rail title="Trending now" items={home.trending} eager />

        <section className="px-4 py-6 sm:px-8">
          <div className="flex gap-2 overflow-x-auto rail pb-1">
            <Link
              href="/live"
              className="flex shrink-0 items-center gap-2 rounded-full bg-[var(--accent)]/15 px-4 py-2 text-sm font-medium text-[var(--accent)] ring-1 ring-[var(--accent)]/30 transition-transform hover:scale-105"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
              {live.total.toLocaleString()} live channels
            </Link>
            {genres.slice(0, 18).map((genre) => (
              <Link
                key={genre.slug}
                href={`/browse/${genre.slug}`}
                className="shrink-0 rounded-full bg-white/8 px-4 py-2 text-sm text-muted transition-all hover:scale-105 hover:bg-white/15 hover:text-ink"
              >
                {genre.name}
              </Link>
            ))}
            <Link
              href="/browse"
              className="shrink-0 rounded-full bg-white/8 px-4 py-2 text-sm text-muted transition-all hover:scale-105 hover:text-ink"
            >
              All {genres.length} categories →
            </Link>
          </div>
        </section>

        {home.rows.map((row) => (
          <Rail
            key={row.slug}
            title={row.name}
            href={`/browse/${row.slug}`}
            items={row.items}
          />
        ))}
      </div>
    </>
  );
}
