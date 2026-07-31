import Link from "next/link";
import { notFound } from "next/navigation";
import { PosterCard } from "@/components/Card";
import { getGenrePage, getGenres } from "@/lib/catalog";

export const revalidate = 3600;

export async function generateStaticParams() {
  const genres = await getGenres();
  return genres.map((genre) => ({ slug: genre.slug }));
}

export default async function GenrePage({
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
    data = await getGenrePage(slug, page);
  } catch {
    notFound();
  }

  return (
    <div className="px-4 py-10 sm:px-8">
      <Link href="/browse" className="text-xs text-muted transition-colors hover:text-ink">
        ← All categories
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {data.name}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {data.total.toLocaleString()} titles · page {data.page + 1} of {data.pages}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {data.items.map((item, index) => (
          <PosterCard key={item.i} item={item} eager={index < 12} />
        ))}
      </div>

      <nav className="mt-12 flex items-center justify-center gap-3">
        {data.page > 0 && (
          <Link
            href={`/browse/${slug}?page=${data.page - 1}`}
            className="rounded-full bg-white/8 px-5 py-2.5 text-sm transition-colors hover:bg-white/15"
          >
            ← Previous
          </Link>
        )}
        {data.page + 1 < data.pages && (
          <Link
            href={`/browse/${slug}?page=${data.page + 1}`}
            className="rounded-full bg-white/8 px-5 py-2.5 text-sm transition-colors hover:bg-white/15"
          >
            Next →
          </Link>
        )}
      </nav>
    </div>
  );
}
