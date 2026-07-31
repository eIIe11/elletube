import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { WatchlistButton } from "@/components/WatchlistButton";
import { getArchiveItem } from "@/lib/archive";

export const revalidate = 86400;

function runtimeLabel(minutes: number | null) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default async function TitlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getArchiveItem(decodeURIComponent(id));
  if (!item) notFound();

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-[46vh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.poster} alt="" className="h-full w-full object-cover opacity-25 blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row">
          <div className="w-[190px] shrink-0 self-start overflow-hidden rounded-2xl ring-1 ring-white/10 sm:w-[240px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.poster}
              alt={item.title}
              className="aspect-[2/3] w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              {item.title}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {[item.year, runtimeLabel(item.runtime), item.creator]
                .filter(Boolean)
                .map((value) => (
                  <span key={String(value)}>{value}</span>
                ))}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {item.streamUrl ? (
                <Link
                  href={`/watch/${encodeURIComponent(item.id)}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
                >
                  <Play size={17} fill="currentColor" /> Play
                </Link>
              ) : (
                <span className="rounded-full bg-white/8 px-6 py-3 text-sm text-muted">
                  No browser-playable file for this title
                </span>
              )}
              <WatchlistButton
                item={{
                  i: item.id,
                  t: item.title,
                  y: item.year,
                  k: "movie",
                  r: item.runtime,
                  g: item.subjects[0] ?? "Open",
                }}
              />
            </div>

            {item.overview && (
              <p className="mt-7 max-w-3xl text-sm leading-relaxed text-ink/80">
                {item.overview.slice(0, 1400)}
              </p>
            )}

            {item.subjects.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2">
                {item.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full bg-white/8 px-3 py-1 text-xs text-muted"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-8 text-xs text-muted">
              Licence: {item.license} ·{" "}
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/20 underline-offset-2 hover:text-ink"
              >
                source
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
