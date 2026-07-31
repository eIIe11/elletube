/**
 * Builds the Lumen catalog from open, freely-licensed sources:
 *  - Internet Archive (public domain / Creative Commons films, TV, documentaries)
 *  - IPTV-org (open index of publicly available free-to-air live streams)
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "data");

const subj = (...terms) => `(${terms.map((t) => `subject:("${t}")`).join(" OR ")})`;

/**
 * Every source becomes a dedicated browse category. `q` is an Internet Archive
 * query restricted to openly licensed material; each page yields up to 500 items.
 */
const SOURCES = [
  // Priority categories
  { genre: "Reality TV", kind: "series", pages: 6, q: `(${subj("reality television", "reality tv", "game show", "talent show", "dating show", "docusoap", "variety show")} OR title:("reality show"))` },
  { genre: "Sapphic Cinema", kind: "movie", pages: 5, q: `(${subj("lesbian", "sapphic", "women loving women", "wlw")} OR title:("lesbian"))` },
  { genre: "LGBTQ+", kind: "movie", pages: 6, q: subj("lgbt", "lgbtq", "queer", "gay", "pride", "transgender", "bisexual", "drag") },

  // Curated open collections
  { genre: "Features", kind: "movie", pages: 8, q: "collection:(feature_films)" },
  { genre: "Classic TV", kind: "series", pages: 6, q: "collection:(classic_tv)" },
  { genre: "Silent Era", kind: "movie", pages: 3, q: "collection:(silent_films)" },
  { genre: "Animation", kind: "movie", pages: 4, q: `(collection:(classic_cartoons) OR collection:(animationandcartoons) OR ${subj("cartoon", "animation", "animated")})` },
  { genre: "Archival", kind: "documentary", pages: 5, q: "collection:(prelinger)" },
  { genre: "Short Films", kind: "movie", pages: 4, q: `(collection:(shortfilms) OR ${subj("short film")})` },
  { genre: "Open Movies", kind: "movie", pages: 2, q: subj("blender foundation", "creative commons", "open movie") },

  // Genres
  { genre: "Film Noir", kind: "movie", pages: 3, q: subj("film noir", "noir", "crime drama") },
  { genre: "Horror", kind: "movie", pages: 5, q: subj("horror", "monster", "vampire", "zombie", "slasher", "ghost") },
  { genre: "Sci-Fi", kind: "movie", pages: 5, q: subj("science fiction", "sci-fi", "scifi", "space opera", "robot", "alien") },
  { genre: "Thriller", kind: "movie", pages: 4, q: subj("thriller", "suspense", "mystery") },
  { genre: "Comedy", kind: "movie", pages: 5, q: subj("comedy", "slapstick", "parody", "sitcom") },
  { genre: "Drama", kind: "movie", pages: 5, q: subj("drama", "melodrama") },
  { genre: "Romance", kind: "movie", pages: 4, q: subj("romance", "romantic", "love story") },
  { genre: "Action", kind: "movie", pages: 4, q: subj("action", "adventure", "spy", "heist") },
  { genre: "Westerns", kind: "movie", pages: 4, q: subj("western", "cowboy", "wild west") },
  { genre: "Musicals", kind: "movie", pages: 3, q: subj("musical", "music film", "opera") },
  { genre: "Concerts", kind: "documentary", pages: 3, q: subj("concert", "live music", "festival", "performance") },
  { genre: "War", kind: "movie", pages: 4, q: subj("war", "world war ii", "world war i", "military") },
  { genre: "Martial Arts", kind: "movie", pages: 2, q: subj("martial arts", "kung fu", "samurai", "karate") },
  { genre: "Anime", kind: "series", pages: 3, q: subj("anime", "manga", "japanese animation") },
  { genre: "Kids & Family", kind: "series", pages: 4, q: subj("children", "kids", "family", "fairy tale", "puppet") },
  { genre: "Fantasy", kind: "movie", pages: 3, q: subj("fantasy", "mythology", "magic") },
  { genre: "Crime", kind: "series", pages: 3, q: subj("crime", "detective", "police", "gangster") },
  { genre: "True Crime", kind: "documentary", pages: 3, q: subj("true crime", "murder", "investigation", "forensics") },
  { genre: "Sport", kind: "documentary", pages: 3, q: `(collection:(sports) OR ${subj("sports", "boxing", "football", "olympics")})` },

  // Factual
  { genre: "Documentary", kind: "documentary", pages: 6, q: `(collection:(documentaryfilms) OR ${subj("documentary", "documentaries")})` },
  { genre: "Nature", kind: "documentary", pages: 3, q: subj("nature", "wildlife", "animals", "ocean", "environment") },
  { genre: "Space", kind: "documentary", pages: 3, q: `(collection:(nasa) OR ${subj("nasa", "space", "astronomy", "apollo", "spaceflight")})` },
  { genre: "Science", kind: "documentary", pages: 3, q: subj("science", "physics", "biology", "technology", "medicine") },
  { genre: "History", kind: "documentary", pages: 4, q: subj("history", "historical", "biography", "archaeology") },
  { genre: "Travel", kind: "documentary", pages: 3, q: subj("travel", "tourism", "geography", "culture") },
  { genre: "Politics", kind: "documentary", pages: 2, q: subj("politics", "government", "election", "activism") },
  { genre: "Education", kind: "documentary", pages: 3, q: subj("educational", "lecture", "instructional", "tutorial") },

  // Lifestyle / unscripted
  { genre: "Food", kind: "series", pages: 2, q: subj("cooking", "food", "cuisine", "recipe", "baking") },
  { genre: "Home & DIY", kind: "series", pages: 2, q: subj("home improvement", "diy", "renovation", "gardening", "craft") },
  { genre: "Fashion & Beauty", kind: "series", pages: 2, q: subj("fashion", "style", "beauty", "makeover") },
  { genre: "Comedy Specials", kind: "documentary", pages: 2, q: subj("stand-up comedy", "comedy special", "sketch comedy") },
  { genre: "Talk Shows", kind: "series", pages: 2, q: subj("talk show", "chat show") },
  { genre: "Interviews", kind: "series", pages: 4, minRuntime: 20, q: `(${subj("interview", "interviews", "round table", "roundtable", "conversation", "in conversation", "oral history")} OR title:("interview" OR "round table" OR "in conversation with"))` },
  { genre: "Wellness", kind: "series", pages: 2, q: subj("meditation", "health", "wellness", "mindfulness") },

  // Fitness. A workout is complete at 15 minutes, so these opt out of the
  // feature-length floor.
  { genre: "Yoga", kind: "series", pages: 3, minRuntime: 15, q: `(${subj("yoga", "vinyasa", "hatha", "ashtanga")} OR title:("yoga"))` },
  { genre: "Pilates", kind: "series", pages: 1, minRuntime: 15, q: `(${subj("pilates", "barre")} OR title:("pilates"))` },
  { genre: "Strength & Dumbbells", kind: "series", pages: 2, minRuntime: 15, q: `(${subj("workout", "weight training", "bodybuilding", "strength training", "calisthenics")} OR title:("dumbbell"))` },
  { genre: "Cardio & HIIT", kind: "series", pages: 2, minRuntime: 15, q: `(${subj("aerobics", "exercise", "cardio", "hiit")} OR title:("aerobics"))` },
  { genre: "Stretch & Mobility", kind: "series", pages: 2, minRuntime: 10, q: subj("stretching", "tai chi", "qigong", "mobility", "flexibility") },
  { genre: "Dance Workouts", kind: "series", pages: 1, minRuntime: 15, q: `(${subj("dance workout", "zumba", "dance exercise", "aerobic dance")} OR title:("dance workout"))` },

  // Cult & world
  { genre: "Cult Classics", kind: "movie", pages: 3, q: subj("cult film", "b-movie", "exploitation", "grindhouse") },
  { genre: "World Cinema", kind: "movie", pages: 4, q: subj("foreign film", "world cinema", "french cinema", "italian cinema", "soviet cinema", "bollywood") },
  { genre: "Serials", kind: "series", pages: 3, q: subj("serial", "cliffhanger", "chapter play") },

  // Released government and intelligence archives.
  { genre: "Declassified", kind: "documentary", pages: 5, minRuntime: 15, q: `(collection:(CIA_CREST) OR collection:(nationalarchives) OR collection:(fbi_files) OR ${subj("declassified", "classified", "cia", "fbi", "nsa", "kgb", "intelligence agency", "government archive", "national archives", "freedom of information", "psychological operations")})` },
];

/**
 * Atrocity and graphic-trauma material. Real history, kept in the catalogue,
 * but never surfaced unasked: it is pulled out of the hero, trending and rails
 * and only reachable by deliberately opening the Heavy Viewing category.
 */
const HEAVY_VIEWING =
  /(holocaust|concentration camp|death camp|auschwitz|buchenwald|dachau|treblinka|bergen-belsen|nazi atroc|genocide|khmer rouge|killing fields|rwandan? genocide|ethnic cleansing|mass grave|war crimes?|nuremberg trial|einsatzgruppen|lynching|massacre|torture|execution footage|atomic bomb victims|hiroshima victims|nanking massacre|famine victims|autopsy|crime scene photos|graphic violence|shock (video|footage)|snuff)/i;

/**
 * Uploads that are neither cinema nor archive worth browsing: hate propaganda,
 * conspiracy and shock oddities that the Archive hosts but nobody is looking
 * for here. Rejected outright rather than filed away.
 */
const UNWANTED =
  /(white (power|nationalis)|neo-?nazi (rally|propaganda)|nazi propaganda|hitler speech|mein kampf|racial hygiene|holocaust denial|flat earth|qanon|great replacement|antisemit|blood libel|jihadi|isis (video|execution)|beheading|self-harm|pro-?ana|animal (cruelty|torture)|snuff)/i;

const FIELDS = [
  "identifier",
  "title",
  "year",
  "date",
  "description",
  "subject",
  "creator",
  "downloads",
  "runtime",
  "licenseurl",
  "item_size",
  "format",
  "avg_rating",
];

// Quality gates: full-length, watchable, browser-playable material only.
const MIN_RUNTIME_MIN = 40;
const MIN_ITEM_BYTES = 250 * 1024 * 1024;
const MIN_DOWNLOADS = 300;
const JUNK_TITLE =
  /(trailer|teaser|clip|excerpt|promo|preview|sample|test upload|sermon|bible study|jesus film|episode \d+ of|part \d+ of \d+|\bintro\b|behind the scenes|commercial|advert)/i;

// Long-but-not-cinema uploads: speedruns, streams, talks, services, radio rips.
const NOT_CINEMA =
  /(speed ?run|any%|100%|playthrough|walkthrough|let'?s play|gameplay|\bspeedrun\b|twitch|stream archive|vod \d|lecture|seminar|conference|keynote|webinar|panel discussion|church service|mass service|worship service|full album|audiobook|podcast|radio (show|broadcast|hour)|city council|board meeting|town hall|deposition|oral argument|scanner audio|police scanner|dashcam|security (cam|footage)|\bunboxing\b|\breaction\b|\bhaul\b|\bvlog\b|zoom (call|meeting)|test pattern|colour bars|color bars)/i;

// Console/gaming subject tags that mark an upload as game footage, not film.
const GAME_SUBJECT =
  /(speed ?run|playthrough|walkthrough|let'?s play|gameplay|emulator|twitch)/i;

// The speedrun archive's naming convention: "Game (SNES) - 3:56 - Runner".
const SPEEDRUN_TITLE =
  /\((snes|nes|n64|ps1|ps2|psx|gba|gbc|nds|genesis|gamecube|wii|dos|pc|arcade)\)\s*-\s*\d+[:.]\d+/i;

// Archive description fields are user-editable and get vandalised: threats
// and doxxing have appeared in place of synopses, including on well-known
// public domain films.
const ABUSIVE_TEXT =
  /(pipe ?bomb|bomba de tubo|se ha colocado una bomba|\b(a |the )?bomb (has been |was )?(placed|planted)\b|i (will|am going to) kill (you|them|everyone)|voy a matar|shoot up the (school|building|place)|going to blow up)/i;

/** Vandalised synopses are dropped; the film itself is still legitimate. */
function safeOverview(text) {
  return ABUSIVE_TEXT.test(text) ? "" : text;
}

// Same idea against the synopsis, for uploads with an innocuous title.
const NOT_CINEMA_DESC =
  /(speed ?run|speedrun|playthrough|let'?s play|recorded (live )?on twitch|full (game )?playthrough)/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "lumen-catalog/1.0" } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (i === tries - 1) throw err;
      await sleep(900 * (i + 1));
    }
  }
}

function clean(text) {
  if (!text) return "";
  const raw = Array.isArray(text) ? text.join(" ") : String(text);
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRuntime(value) {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : String(value);
  const parts = raw.split(":").map((n) => parseInt(n, 10));
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 3) return Math.round(parts[0] * 60 + parts[1] + parts[2] / 60);
  if (parts.length === 2) return Math.round(parts[0] + parts[1] / 60);
  return null;
}

function toArray(value) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).flatMap((v) =>
    String(v)
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function titleCase(text) {
  return text.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

async function fetchPage(source, page) {
  const params = new URLSearchParams({
    q: `${source.q} AND mediatype:(movies)`,
    sort: "downloads desc",
    rows: "500",
    page: String(page),
    output: "json",
  });
  for (const f of FIELDS) params.append("fl[]", f);
  const data = await getJSON(`https://archive.org/advancedsearch.php?${params}`);
  const docs = data?.response?.docs ?? [];
  return docs.map((d) => {
    const year = Number(d.year) || Number(String(d.date ?? "").slice(0, 4)) || null;
    return {
      id: d.identifier,
      kind: source.kind,
      title: clean(d.title) || d.identifier,
      year: year && year > 1870 && year <= new Date().getFullYear() ? year : null,
      overview: safeOverview(clean(d.description).slice(0, 700)),
      genres: [source.genre],
      tags: toArray(d.subject)
        .slice(0, 6)
        .map((t) => titleCase(t.toLowerCase()))
        .filter((t) => t.length > 1 && t.length < 30),
      creator: clean(d.creator).slice(0, 90),
      runtime: parseRuntime(d.runtime),
      popularity: Number(d.downloads) || 0,
      license: d.licenseurl ? String(d.licenseurl) : "Public Domain / Open",
      bytes: Number(d.item_size) || 0,
      formats: toArray(d.format),
      rating: Number(d.avg_rating) || 0,
    };
  });
}

const PLAYABLE = /^(h\.264|mpeg4|512kb mpeg4|ia mp4|hd mp4|matroska|ogg video)$/i;

function isHighQuality(item, minRuntime = MIN_RUNTIME_MIN) {
  if (JUNK_TITLE.test(item.title)) return false;
  if (NOT_CINEMA.test(item.title)) return false;
  if (SPEEDRUN_TITLE.test(item.title)) return false;
  if (NOT_CINEMA_DESC.test(item.overview)) return false;
  if (UNWANTED.test(item.title) || UNWANTED.test(item.overview)) return false;
  if (item.tags.some((t) => UNWANTED.test(t))) return false;
  if (ABUSIVE_TEXT.test(item.title)) return false;
  if (item.tags.some((t) => GAME_SUBJECT.test(t))) return false;
  if (item.popularity < MIN_DOWNLOADS) return false;
  if (!item.formats.some((f) => PLAYABLE.test(f))) return false;
  if (item.runtime !== null) return item.runtime >= minRuntime;
  // Without a runtime, fall back to size, scaled to the category's floor.
  return item.bytes >= MIN_ITEM_BYTES * (minRuntime / MIN_RUNTIME_MIN);
}

async function fetchSource(source) {
  const out = [];
  for (let page = 1; page <= source.pages; page++) {
    const docs = await fetchPage(source, page);
    out.push(...docs);
    if (docs.length < 500) break;
    await sleep(250);
  }
  console.log(`  ${source.genre}: ${out.length}`);
  return out;
}

async function buildVod() {
  const seen = new Map();
  for (const source of SOURCES) {
    let items = [];
    try {
      items = await fetchSource(source);
    } catch (err) {
      console.warn(`  ! ${source.genre} failed: ${err.message}`);
      continue;
    }
    for (const item of items) {
      if (!item.title || !isHighQuality(item, source.minRuntime)) continue;
      const existing = seen.get(item.id);
      if (existing) {
        if (!existing.heavy) {
          existing.genres = [...new Set([...existing.genres, ...item.genres])];
        }
        continue;
      }
      if (
        HEAVY_VIEWING.test(item.title) ||
        HEAVY_VIEWING.test(item.overview) ||
        item.tags.some((tag) => HEAVY_VIEWING.test(tag))
      ) {
        item.genres = ["Heavy Viewing"];
        item.heavy = true;
      }
      seen.set(item.id, item);
    }
    await sleep(300);
  }
  const all = [...seen.values()].sort((a, b) => b.popularity - a.popularity);
  all.forEach((item, index) => {
    item.tags = [...new Set(item.tags)].slice(0, 6);
    item.rank = index;
    delete item.formats;
    delete item.bytes;
  });
  return all;
}

const LIVE_CATEGORY = {
  news: "News",
  business: "Business",
  sports: "Sport",
  music: "Music",
  movies: "Movies",
  series: "Series",
  documentary: "Documentary",
  kids: "Kids",
  science: "Science",
  travel: "Travel",
  outdoor: "Outdoor",
  culture: "Culture",
  entertainment: "Entertainment",
  weather: "Weather",
  education: "Education",
  lifestyle: "Reality TV",
  cooking: "Food",
  comedy: "Comedy",
  animation: "Animation",
  auto: "Auto",
  family: "Family",
  general: "General",
  legislative: "Politics",
  religious: "Religion",
  shop: "Shopping",
};

async function buildLive() {
  const [channels, streams] = await Promise.all([
    getJSON("https://iptv-org.github.io/api/channels.json"),
    getJSON("https://iptv-org.github.io/api/streams.json"),
  ]);
  const byId = new Map(channels.map((c) => [c.id, c]));
  const picked = new Map();

  for (const s of streams) {
    if (!s.channel || !s.url) continue;
    if (!s.url.startsWith("https://")) continue; // avoid mixed-content failures
    if (!s.url.includes(".m3u8")) continue;
    if (s.user_agent || s.referrer) continue; // needs custom headers; won't play in-browser
    const channel = byId.get(s.channel);
    if (!channel || channel.closed || channel.replaced_by || channel.is_nsfw) continue;
    const height = parseInt(String(s.quality ?? "0"), 10) || 0;
    const prev = picked.get(channel.id);
    if (prev && prev.height >= height) continue;
    const categories = (channel.categories ?? []).map((c) => LIVE_CATEGORY[c] ?? "General");
    picked.set(channel.id, {
      id: channel.id,
      kind: "live",
      title: channel.name,
      url: s.url,
      height,
      country: channel.country ?? "",
      languages: channel.languages ?? [],
      logo: channel.logo ?? null,
      genres: [...new Set(categories.length ? categories : ["General"])],
    });
  }

  const list = [...picked.values()].sort((a, b) => a.title.localeCompare(b.title));
  console.log(`  live channels: ${list.length}`);
  return list;
}

/**
 * Books and audiobooks. LibriVox recordings stream in our own player;
 * Project Gutenberg texts are read or downloaded (their EPUB/MOBI files work
 * with Send to Kindle). Both are public domain.
 */
const LIBRARY_SOURCES = [
  { shelf: "Audiobooks", kind: "audiobook", media: "audio", pages: 4, q: "collection:(librivoxaudio)" },
  { shelf: "Fiction", kind: "book", media: "texts", pages: 3, q: `collection:(gutenberg) AND ${subj("fiction", "novel")}` },
  { shelf: "Classics", kind: "book", media: "texts", pages: 3, q: `collection:(gutenberg) AND ${subj("classic literature", "literature")}` },
  { shelf: "Mystery & Crime", kind: "book", media: "texts", pages: 2, q: `collection:(gutenberg) AND ${subj("detective and mystery stories", "crime")}` },
  { shelf: "Science Fiction", kind: "book", media: "texts", pages: 2, q: `collection:(gutenberg) AND ${subj("science fiction", "fantasy fiction")}` },
  { shelf: "Poetry", kind: "book", media: "texts", pages: 1, q: `collection:(gutenberg) AND ${subj("poetry")}` },
  { shelf: "History & Biography", kind: "book", media: "texts", pages: 2, q: `collection:(gutenberg) AND ${subj("history", "biography")}` },
];

async function fetchLibraryPage(source, page) {
  const params = new URLSearchParams({
    q: `${source.q} AND mediatype:(${source.media})`,
    sort: "downloads desc",
    rows: "500",
    page: String(page),
    output: "json",
  });
  for (const f of ["identifier", "title", "creator", "year", "date", "subject", "downloads", "runtime", "language"]) {
    params.append("fl[]", f);
  }
  const data = await getJSON(`https://archive.org/advancedsearch.php?${params}`);
  return (data?.response?.docs ?? []).map((d) => ({
    id: d.identifier,
    kind: source.kind,
    title: clean(d.title) || d.identifier,
    author: clean(d.creator).slice(0, 90),
    year: Number(d.year) || Number(String(d.date ?? "").slice(0, 4)) || null,
    shelves: [source.shelf],
    language: first(d.language) || "",
    popularity: Number(d.downloads) || 0,
  }));
}

const first = (v) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

async function buildLibrary() {
  const seen = new Map();
  for (const source of LIBRARY_SOURCES) {
    let count = 0;
    for (let page = 1; page <= source.pages; page++) {
      let docs = [];
      try {
        docs = await fetchLibraryPage(source, page);
      } catch (err) {
        console.warn(`  ! ${source.shelf} p${page} failed: ${err.message}`);
        break;
      }
      for (const entry of docs) {
        if (!entry.title || JUNK_TITLE.test(entry.title)) continue;
        if (ABUSIVE_TEXT.test(entry.title)) continue;
        const existing = seen.get(entry.id);
        if (existing) {
          existing.shelves = [...new Set([...existing.shelves, ...entry.shelves])];
          continue;
        }
        seen.set(entry.id, entry);
        count++;
      }
      if (docs.length < 500) break;
      await sleep(250);
    }
    console.log(`  ${source.shelf}: ${count}`);
    await sleep(300);
  }
  return [...seen.values()].sort((a, b) => b.popularity - a.popularity);
}

async function main() {
  console.log("Fetching Internet Archive categories...");
  const vod = await buildVod();
  console.log(`  total titles: ${vod.length}`);
  console.log("Fetching IPTV-org open live catalog...");
  const live = await buildLive();
  console.log("Fetching LibriVox and Project Gutenberg library...");
  const library = await buildLibrary();
  console.log(`  total library entries: ${library.length}`);

  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, "catalog.json"), JSON.stringify(vod), "utf8");
  await writeFile(join(OUT, "live.json"), JSON.stringify(live), "utf8");
  await writeFile(join(OUT, "library.json"), JSON.stringify(library), "utf8");
  console.log("Wrote catalog.json, live.json and library.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
