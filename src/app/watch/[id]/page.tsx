import Link from "next/link";
import { notFound } from "next/navigation";
import { Player } from "@/components/Player";
import { getArchiveItem } from "@/lib/archive";
import { formatRuntime } from "@/lib/catalog";

export const revalidate = 86400;

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getArchiveItem(decodeURIComponent(id));
  if (!item || !item.streamUrl) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
      <Player
        src={item.streamUrl}
        title={item.title}
        storageKey={item.id}
        poster={item.poster}
      />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {item.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {[item.year, formatRuntime(item.runtime), item.creator]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <Link
          href={`/title/${encodeURIComponent(item.id)}`}
          className="rounded-full bg-white/8 px-5 py-2.5 text-sm transition-colors hover:bg-white/15"
        >
          Details
        </Link>
      </div>

      {item.overview && (
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-ink/75">
          {item.overview.slice(0, 900)}
        </p>
      )}

      <p className="mt-8 text-xs text-muted">
        Shortcuts: space play/pause · ← → seek 10s (shift 30s) · ↑ ↓ volume · m mute ·
        f fullscreen · p picture-in-picture
      </p>
    </div>
  );
}
