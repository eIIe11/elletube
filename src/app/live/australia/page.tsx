import { getLiveAustralia } from "@/lib/catalog";
import { AustraliaLive } from "@/components/AustraliaLive";

export const revalidate = 3600;

export const metadata = { title: "Australian TV — BooTube" };

export default async function AustraliaPage() {
  const data = await getLiveAustralia();

  return (
    <div className="px-4 py-10 sm:px-8">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent)]" />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Australian TV
        </h1>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {data.total} free-to-air Australian channels, grouped by network. Every
        stream here was checked and playing at build time; some feeds are
        restricted to Australian viewers.
      </p>

      <AustraliaLive groups={data.groups} />
    </div>
  );
}
