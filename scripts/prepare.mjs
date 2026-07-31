/**
 * Turns the raw catalog into lean, CDN-friendly static shards under public/data.
 *
 *   genres.json            list of categories + counts
 *   g/<slug>/<page>.json   48 cards per page
 *   title/<id>.json        detail payload
 *   home.json              curated homepage rows
 *   live/index.json        live categories + counts
 *   live/<slug>.json       channels per category
 *   search.json            compact search index (lazy loaded)
 */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src", "data");
const OUT = join(ROOT, "public", "data");
const PER_PAGE = 48;

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function writeJSON(relative, data) {
  const file = join(OUT, relative);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data), "utf8");
}

function toCard(item) {
  return {
    i: item.id,
    t: item.title,
    y: item.year,
    k: item.kind,
    r: item.runtime,
    g: item.genres[0],
  };
}

async function main() {
  const catalog = JSON.parse(await readFile(join(SRC, "catalog.json"), "utf8"));
  const live = JSON.parse(await readFile(join(SRC, "live.json"), "utf8"));
  const library = JSON.parse(await readFile(join(SRC, "library.json"), "utf8"));

  await rm(OUT, { recursive: true, force: true });

  // --- categories ---------------------------------------------------------
  const byGenre = new Map();
  for (const item of catalog) {
    for (const genre of item.genres) {
      if (!byGenre.has(genre)) byGenre.set(genre, []);
      byGenre.get(genre).push(item);
    }
  }

  const genres = [];
  for (const [name, items] of byGenre) {
    const slug = slugify(name);
    items.sort((a, b) => b.popularity - a.popularity);
    const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
    for (let page = 0; page < pages; page++) {
      await writeJSON(`g/${slug}/${page}.json`, {
        name,
        slug,
        page,
        pages,
        total: items.length,
        items: items.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map(toCard),
      });
    }
    genres.push({ name, slug, count: items.length, pages });
  }
  genres.sort((a, b) => b.count - a.count);
  await writeJSON("genres.json", genres);

  // Detail pages read live metadata straight from the source archive at runtime,
  // so no per-title shards are emitted (35k tiny files would bloat the deploy).

  // --- homepage -----------------------------------------------------------
  const pick = (name, limit = 24) =>
    (byGenre.get(name) ?? []).slice(0, limit).map(toCard);

  // Atrocity material stays in the catalogue but is never surfaced unasked.
  const gentle = catalog.filter((item) => !item.heavy);

  const spotlight = gentle
    .filter((item) => item.overview.length > 180 && item.year)
    .slice(0, 8)
    .map((item) => ({
      ...toCard(item),
      o: item.overview.slice(0, 260),
      gs: item.genres.slice(0, 3),
    }));

  const ROW_ORDER = [
    "Reality TV",
    "Sapphic Cinema",
    "LGBTQ+",
    "Features",
    "Classic TV",
    "Documentary",
    "Horror",
    "Sci-Fi",
    "Comedy",
    "Film Noir",
    "Westerns",
    "Animation",
    "True Crime",
    "Nature",
    "Space",
    "World Cinema",
    "Cult Classics",
    "Interviews",
    "Yoga",
    "Strength & Dumbbells",
    "Concerts",
    "Kids & Family",
    "Silent Era",
  ];

  await writeJSON("home.json", {
    spotlight,
    trending: gentle.slice(0, 24).map(toCard),
    rows: ROW_ORDER.filter((name) => byGenre.has(name)).map((name) => ({
      name,
      slug: slugify(name),
      items: pick(name),
    })),
  });

  // --- live ---------------------------------------------------------------
  const liveByGenre = new Map();
  for (const channel of live) {
    for (const genre of channel.genres) {
      if (!liveByGenre.has(genre)) liveByGenre.set(genre, []);
      liveByGenre.get(genre).push(channel);
    }
  }
  const liveIndex = [];
  for (const [name, channels] of liveByGenre) {
    const slug = slugify(name);
    await writeJSON(`live/${slug}.json`, { name, slug, channels });
    liveIndex.push({ name, slug, count: channels.length });
  }
  liveIndex.sort((a, b) => b.count - a.count);

  // Country shards, so local channels are one tap away.
  const byCountry = new Map();
  for (const channel of live) {
    if (!channel.country) continue;
    if (!byCountry.has(channel.country)) byCountry.set(channel.country, []);
    byCountry.get(channel.country).push(channel);
  }
  const countries = [];
  for (const [code, channels] of byCountry) {
    const slug = `country-${code.toLowerCase()}`;
    await writeJSON(`live/${slug}.json`, { name: code, slug, channels });
    countries.push({ code, slug, count: channels.length });
  }
  countries.sort((a, b) => b.count - a.count);

  // Australia gets its own surface, grouped by broadcaster rather than genre.
  const AU_NETWORKS = [
    { name: "ABC", match: /^abc\b|australian broadcasting/i },
    { name: "SBS", match: /^sbs\b|\bnitv\b/i },
    { name: "Seven Network", match: /^(7|seven)\b|7mate|7two|7flix|7bravo/i },
    { name: "Nine Network", match: /^(9|nine)\b|9gem|9go|9life|9rush/i },
    { name: "Network 10", match: /^(10|ten)\b|10 bold|10 peach|10 shake/i },
    { name: "News", match: /news|sky/i },
    { name: "Sport", match: /sport|racing|footy|cricket/i },
    { name: "Music", match: /music|mtv|hits|country/i },
  ];
  const au = byCountry.get("AU") ?? [];
  const claimed = new Set();
  const auGroups = [];
  for (const network of AU_NETWORKS) {
    const channels = au.filter(
      (c) => !claimed.has(c.id) && network.match.test(c.title)
    );
    channels.forEach((c) => claimed.add(c.id));
    if (channels.length) auGroups.push({ name: network.name, channels });
  }
  const rest = au.filter((c) => !claimed.has(c.id));
  if (rest.length) auGroups.push({ name: "More Australian channels", channels: rest });
  await writeJSON("live/australia.json", { total: au.length, groups: auGroups });

  await writeJSON("live/index.json", {
    categories: liveIndex,
    countries,
    featured: live.filter((c) => c.logo).slice(0, 40),
    total: live.length,
  });

  // --- library (books + audiobooks) ---------------------------------------
  const byShelf = new Map();
  for (const entry of library) {
    for (const shelf of entry.shelves) {
      if (!byShelf.has(shelf)) byShelf.set(shelf, []);
      byShelf.get(shelf).push(entry);
    }
  }
  const shelves = [];
  for (const [name, entries] of byShelf) {
    const slug = slugify(name);
    const pages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
    for (let page = 0; page < pages; page++) {
      await writeJSON(`library/${slug}/${page}.json`, {
        name,
        slug,
        page,
        pages,
        total: entries.length,
        items: entries.slice(page * PER_PAGE, (page + 1) * PER_PAGE),
      });
    }
    shelves.push({ name, slug, count: entries.length, pages });
  }
  shelves.sort((a, b) => b.count - a.count);
  await writeJSON("library/index.json", {
    shelves,
    total: library.length,
    featured: library.slice(0, 24),
  });

  // --- discovery index (Time Machine, Mood Mixer, Roulette) ---------------
  const genreKeys = genres.map((g) => g.name);
  const genreKey = new Map(genreKeys.map((name, i) => [name, i]));
  await writeJSON("discover.json", {
    genres: genreKeys,
    // [id, title, year, kind, runtime, genreIndexes]
    items: gentle.map((item) => [
      item.id,
      item.title,
      item.year ?? 0,
      item.kind[0],
      item.runtime ?? 0,
      item.genres.map((g) => genreKey.get(g) ?? 0),
    ]),
  });

  // --- search index -------------------------------------------------------
  await writeJSON("search.json", {
    vod: catalog.map((item) => [item.id, item.title, item.year ?? 0, item.kind[0]]),
    live: live.map((c) => [c.id, c.title, 0, "l"]),
  });

  console.log(
    `Shards written: ${genres.length} categories, ${catalog.length} titles, ${liveIndex.length} live categories`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
