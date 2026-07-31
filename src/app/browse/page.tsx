import Link from "next/link";
import { getGenres } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata = { title: "Browse categories — ElleTube" };

export default async function BrowsePage() {
  const genres = await getGenres();
  const total = genres.reduce((sum, genre) => sum + genre.count, 0);

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Browse</h1>
      <p className="mt-2 text-sm text-muted">
        {genres.length} categories · {total.toLocaleString()} category slots across
        the open catalogue.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {genres.map((genre, index) => (
          <Link
            key={genre.slug}
            href={`/browse/${genre.slug}`}
            className="group relative overflow-hidden rounded-2xl bg-surface p-5 ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1 hover:ring-white/20"
            style={{ animationDelay: `${Math.min(index, 20) * 18}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent-2)]/0 opacity-0 transition-opacity duration-300 group-hover:from-[var(--accent)]/20 group-hover:to-[var(--accent-2)]/20 group-hover:opacity-100" />
            <p className="relative text-base font-semibold">{genre.name}</p>
            <p className="relative mt-1 text-xs text-muted">
              {genre.count.toLocaleString()} titles
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
