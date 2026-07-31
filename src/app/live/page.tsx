import { getLiveCategory, getLiveIndex } from "@/lib/catalog";
import { LiveBrowser } from "@/components/LiveBrowser";
import type { LiveChannel } from "@/lib/types";

export const revalidate = 3600;

export const metadata = { title: "Live TV — BooTube" };

export default async function LivePage() {
  const index = await getLiveIndex();
  const preload = [
    ...index.countries.filter((c) => c.code === "AU").map((c) => c.slug),
    ...index.categories.slice(0, 10).map((c) => c.slug),
  ];
  const initial = await Promise.all(
    preload.map(async (slug) => {
      const data = await getLiveCategory(slug);
      return [slug, data.channels.slice(0, 120)] as [string, LiveChannel[]];
    })
  );

  return (
    <div className="px-4 py-10 sm:px-8">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent)]" />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Live TV</h1>
      </div>
      <p className="mt-2 text-sm text-muted">
        {index.total.toLocaleString()} free-to-air channels from the open IPTV index.
        Availability varies by region.
      </p>

      <LiveBrowser
        categories={index.categories}
        countries={index.countries}
        initial={Object.fromEntries(initial)}
      />
    </div>
  );
}
