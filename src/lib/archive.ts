/** Resolves playable files + metadata straight from the source archive. */

type ArchiveFile = {
  name: string;
  format?: string;
  size?: string;
  length?: string;
  height?: string;
};

type ArchiveMetadata = {
  metadata?: Record<string, string | string[]>;
  files?: ArchiveFile[];
  server?: string;
  dir?: string;
};

const FORMAT_RANK: Record<string, number> = {
  "h.264": 5,
  "hd mp4": 5,
  "mpeg4": 4,
  "ia mp4": 4,
  "512kb mpeg4": 3,
  "ogg video": 1,
};

const first = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

/**
 * Archive description fields are publicly editable and have been vandalised
 * with threats and doxxing; suppress the synopsis rather than render it.
 */
const ABUSIVE_TEXT =
  /(pipe ?bomb|bomba de tubo|se ha colocado una bomba|\b(a |the )?bomb (has been |was )?(placed|planted)\b|i (will|am going to) kill (you|them|everyone)|voy a matar|shoot up the (school|building|place)|going to blow up)/i;

function safeOverview(text: string): string {
  return ABUSIVE_TEXT.test(text) ? "" : text;
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSeconds(length: string | undefined): number | null {
  if (!length) return null;
  if (!length.includes(":")) {
    const n = Number(length);
    return Number.isFinite(n) ? n : null;
  }
  const parts = length.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((acc, part) => acc * 60 + part, 0);
}

export async function getArchiveItem(id: string) {
  const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as ArchiveMetadata;
  if (!data.metadata) return null;

  const meta = data.metadata;
  const files = data.files ?? [];

  let best: ArchiveFile | null = null;
  let bestScore = -1;
  for (const file of files) {
    const rank = FORMAT_RANK[String(file.format ?? "").toLowerCase()];
    if (!rank) continue;
    const score = rank * 1e12 + Number(file.size ?? 0);
    if (score > bestScore) {
      bestScore = score;
      best = file;
    }
  }

  const seconds = parseSeconds(best?.length);
  const year = Number(first(meta.year)) || Number(first(meta.date).slice(0, 4)) || null;

  return {
    id,
    title: first(meta.title) || id,
    year,
    overview: safeOverview(stripHtml(first(meta.description))),
    creator: first(meta.creator),
    license: first(meta.licenseurl) || "Public domain / open licence",
    runtime: seconds ? Math.round(seconds / 60) : null,
    subjects: (Array.isArray(meta.subject) ? meta.subject : [first(meta.subject)])
      .flatMap((s) => String(s).split(/[;,]/))
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10),
    streamUrl: best ? `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(best.name)}` : null,
    poster: `https://archive.org/services/img/${encodeURIComponent(id)}`,
    sourceUrl: `https://archive.org/details/${encodeURIComponent(id)}`,
  };
}

export type ArchiveItem = NonNullable<Awaited<ReturnType<typeof getArchiveItem>>>;

const BOOK_FORMATS: { label: string; match: RegExp; kindle: boolean }[] = [
  { label: "EPUB", match: /^epub$/i, kindle: true },
  { label: "Kindle (AZW3)", match: /^(azw3|kindle)$/i, kindle: true },
  { label: "Kindle (MOBI)", match: /^mobi$/i, kindle: true },
  { label: "PDF", match: /^(text pdf|image container pdf|pdf)$/i, kindle: false },
  { label: "Plain text", match: /^(djvutxt|text|plain text)$/i, kindle: false },
];

const AUDIO_FORMATS = /^(vbr mp3|128kbps mp3|64kbps mp3|mp3|ogg vorbis)$/i;

export type LibraryDownload = { label: string; url: string; kindle: boolean };
export type AudioTrack = { title: string; url: string; seconds: number | null };

/** Resolves official Archive download links and audio tracks for a library entry. */
export async function getArchiveLibraryItem(id: string) {
  const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as ArchiveMetadata;
  if (!data.metadata) return null;

  const meta = data.metadata;
  const files = data.files ?? [];
  const fileUrl = (name: string) =>
    `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(name)}`;

  const downloads: LibraryDownload[] = [];
  for (const spec of BOOK_FORMATS) {
    const file = files.find((f) => spec.match.test(String(f.format ?? "")));
    if (file) downloads.push({ label: spec.label, url: fileUrl(file.name), kindle: spec.kindle });
  }

  const seenTracks = new Set<string>();
  const tracks: AudioTrack[] = [];
  for (const file of files) {
    if (!AUDIO_FORMATS.test(String(file.format ?? ""))) continue;
    const key = file.name.replace(/\.[^.]+$/, "");
    if (seenTracks.has(key)) continue;
    seenTracks.add(key);
    tracks.push({
      title: key.replace(/[_-]+/g, " "),
      url: fileUrl(file.name),
      seconds: parseSeconds(file.length),
    });
  }
  tracks.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));

  return {
    id,
    title: first(meta.title) || id,
    author: first(meta.creator),
    year: Number(first(meta.year)) || Number(first(meta.date).slice(0, 4)) || null,
    overview: safeOverview(stripHtml(first(meta.description))),
    license: first(meta.licenseurl) || "Public domain",
    cover: `https://archive.org/services/img/${encodeURIComponent(id)}`,
    readUrl: `https://archive.org/details/${encodeURIComponent(id)}`,
    downloads,
    tracks,
  };
}

export type ArchiveLibraryItem = NonNullable<
  Awaited<ReturnType<typeof getArchiveLibraryItem>>
>;
