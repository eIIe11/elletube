import Link from "next/link";
import { notFound } from "next/navigation";
import { AudiobookPlayer } from "@/components/AudiobookPlayer";
import { getArchiveLibraryItem } from "@/lib/archive";

export const revalidate = 86400;

export default async function LibraryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getArchiveLibraryItem(decodeURIComponent(id));
  if (!item) notFound();

  const kindle = item.downloads.filter((d) => d.kindle);
  const other = item.downloads.filter((d) => !d.kindle);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <Link href="/library" className="text-xs text-muted transition-colors hover:text-ink">
        ← Library
      </Link>

      <div className="mt-5 flex flex-col gap-8 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.cover}
          alt=""
          className="h-64 w-44 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">{item.title}</h1>
          <p className="mt-2 text-sm text-muted">
            {[item.author, item.year, item.license].filter(Boolean).join(" · ")}
          </p>
          {item.overview && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/80">
              {item.overview.slice(0, 900)}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={item.readUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
            >
              Read online
            </a>
            {kindle.map((download) => (
              <a
                key={download.url}
                href={download.url}
                className="rounded-full bg-white/10 px-5 py-2.5 text-sm transition-colors hover:bg-white/20"
              >
                Send to Kindle · {download.label}
              </a>
            ))}
            {other.map((download) => (
              <a
                key={download.url}
                href={download.url}
                className="rounded-full bg-white/8 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-white/15 hover:text-ink"
              >
                {download.label}
              </a>
            ))}
          </div>
          {kindle.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              Email the EPUB or AZW3 to your Send-to-Kindle address, or drop it on
              the device over USB.
            </p>
          )}
        </div>
      </div>

      {item.tracks.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Listen</h2>
          <AudiobookPlayer id={item.id} tracks={item.tracks} />
        </section>
      )}
    </div>
  );
}
