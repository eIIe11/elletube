import Link from "next/link";
import { getLibraryIndex } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata = { title: "Library — BooTube" };

export default async function LibraryPage() {
  const index = await getLibraryIndex();

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Library</h1>
      <p className="mt-2 text-sm text-muted">
        {index.total.toLocaleString()} public-domain books and audiobooks from
        Project Gutenberg, LibriVox and the Internet Archive. Read in the browser,
        send to Kindle, or listen with resume.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {index.shelves.map((shelf) => (
          <Link
            key={shelf.slug}
            href={`/library/${shelf.slug}`}
            className="group relative overflow-hidden rounded-2xl bg-surface p-5 ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1 hover:ring-white/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent-2)]/0 opacity-0 transition-opacity duration-300 group-hover:from-[var(--accent)]/20 group-hover:to-[var(--accent-2)]/20 group-hover:opacity-100" />
            <p className="relative text-base font-semibold">{shelf.name}</p>
            <p className="relative mt-1 text-xs text-muted">
              {shelf.count.toLocaleString()} titles
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
