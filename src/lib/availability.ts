export type MediaSource = {
  streamUrl: string;
  territories: "worldwide" | string[];
  licence: "public-domain" | "creative-commons" | "direct-licence";
};

export function sourceAvailable(
  source: MediaSource,
  countryCode: string
): boolean {
  return (
    source.territories === "worldwide" ||
    source.territories.includes(countryCode.toUpperCase())
  );
}

/**
 * Live channels carry the country their broadcaster serves; anything published
 * from a national free-to-air service is treated as restricted to that
 * territory unless it is explicitly a global feed.
 */
const GLOBAL_CATEGORIES = new Set([
  "News",
  "Weather",
  "Science",
  "Documentary",
  "Music",
]);

export function channelSource(channel: {
  url: string;
  country: string;
  genres: string[];
}): MediaSource {
  const global =
    !channel.country || channel.genres.some((g) => GLOBAL_CATEGORIES.has(g));
  return {
    streamUrl: channel.url,
    territories: global ? "worldwide" : [channel.country.toUpperCase()],
    licence: "direct-licence",
  };
}

/** Archive.org material is public domain / CC, so it plays everywhere. */
export function archiveSource(streamUrl: string): MediaSource {
  return { streamUrl, territories: "worldwide", licence: "public-domain" };
}
