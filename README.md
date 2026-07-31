# ElleTube

An ad-free streaming platform for openly licensed video: 35,000+ full-length
films, series and documentaries from the Internet Archive, plus 8,000+
free-to-air live channels from the open IPTV-org index.

No ads. No trackers. No accounts.

## How it works

```
scripts/ingest.mjs   → src/data/{catalog,live}.json   (raw, gitignored)
scripts/prepare.mjs  → public/data/**                 (lean CDN shards)
```

* **Ingest** queries the Internet Archive across 46 dedicated categories and the
  IPTV-org channel index, applying quality gates: full-length only
  (≥40 min or ≥250 MB), a browser-playable format, and a popularity floor.
* **Prepare** splits the catalogue into small static JSON shards — 48 cards per
  category page, per-category live channel lists, country shards, and compact
  indices for search and discovery — so no page ever ships the whole catalogue.
* **Detail and playback** resolve straight from the source archive at request
  time, so no per-title files are deployed.

Refresh the catalogue with:

```bash
npm run catalog     # ingest + prepare
```

## Features

| Feature | What it does |
| --- | --- |
| Time Machine | Decade dial that reskins the page and filters by era |
| Mood mixer | Three sliders re-rank all 35k titles client-side, live |
| Roulette | Slot-machine spin that lands on a title and auto-plays |
| Zap | Arrow keys surf live channels; `Z` jumps somewhere random |
| My List | Local-only watchlist, no account needed |
| Resume | Playback position remembered per title |

Player shortcuts: `space` play/pause · `←/→` seek 10s (shift 30s) · `↑/↓` volume
· `m` mute · `f` fullscreen · `p` picture-in-picture. Press `/` anywhere to search.

## Licensing and availability

Only public domain and Creative Commons material is catalogued. Live channels
are publicly broadcast free-to-air feeds; `src/lib/availability.ts` gates each
source to the territories its broadcaster serves and shows a clear notice rather
than a dead player when a feed is out of region.

## Development

```bash
npm install
npm run catalog     # first run only: builds public/data
npm run dev
```

```bash
npm run lint
npm run build
```
