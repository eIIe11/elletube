import Link from "next/link";
import { notFound } from "next/navigation";
import { getLibraryIndex, getLibraryShelf } from "@/lib/catalog";

export const revalidate = 3600;

export async function generateStaticParams() {
  const index = await getLibraryIndex();
  return index.shelves.map((shelf) => ({ slug: shelf.slug }));
}

export default async function LibraryShelf({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, Number(pageParam ?? 0) || 0);

  let data;
  try {
    data = await getLibraryShelf(slug, page);
  } catch {
    notFound();
  }

  return (
    <div className="px-4 py-10 sm:px-8">
      <Link href="/library" className="text-xs text-muted transition-colors hover:text-ink">
        ← Library
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {data.name}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {data.total.toLocaleString()} titles · page {data.page + 1} of {data.pages}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((entry) => (
          <Link
            key={entry.id}
            href={`/library/item/${encodeURIComponent(entry.id)}`}
            className="group rounded-2xl bg-surface p-4 ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-0.5 hover:ring-white/20"
          >
            <p className="line-clamp-2 text-sm font-semibold">{entry.title}</p>
            <p className="mt-1 line-clamp-1 text-xs text-muted">
              {[entry.author, entry.year].filter(Boolean).join(" · ")}
            </p>
            <span className="mt-3 inline-block rounded-full bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-wide text-muted">
              {entry.kind === "audiobook" ? "Audiobook" : "Ebook"}
            </span>
          </Link>
        ))}
      </div>

      <nav className="mt-12 flex items-center justify-center gap-3">
        {data.page > 0 && (
          <Link
            href={`/library/${slug}?page=${data.page - 1}`}
            className="rounded-full bg-white/8 px-5 py-2.5 text-sm transition-colors hover:bg-white/15"
          >
            ← Previous
          </Link>
        )}
        {data.page + 1 < data.pages && (
          <Link
            href={`/library/${slug}?page=${data.page + 1}`}
            className="rounded-full bg-white/8 px-5 py-2.5 text-sm transition-colors hover:bg-white/15"
          >
            Next →
          </Link>
        )}
      </nav>
    </div>
  );
}
