# ElleTube E2E Test Plan (local dev, localhost:3000)

Evidence: EntryScreen.tsx:26-45 (sessionStorage `elletube:entered`, Enter/Space), SearchOverlay.tsx:43-55 (`/`, Esc),
Player.tsx:69-140 (resume localStorage + shortcuts space/k, ←/→, ↑/↓, m, f, p), LiveBrowser.tsx:59-80 (Esc, ←/→, Z),
browse/[slug]/page.tsx:28 + watch/[id]/page.tsx:15 (notFound).

1. Entry screen: first load `/` shows splash with "Enter ElleTube"; press Enter → splash gone. Navigate to /browse and back → no splash.
2. Home: hero visible; click 3rd dot indicator → hero title text changes. Hover a rail → right arrow appears; click → rail scrolls (posters change).
3. Browse: /browse → click a category → grid of ≥1 posters; click Next → page 2 shows different titles; Previous returns.
4. Search: press `/` → overlay; type "star" → ≥1 ranked results visible; Esc closes; reopen, click result → navigates to /title/....
5. Title → Watch: open title, metadata (title/year/desc) renders; click Play → /watch page, video currentTime advances >0. Shortcuts: space pauses (paused=true), → seeks +10s, ↓ lowers volume, m mutes. Reload → resumes near prior time (±30s, not 0).
6. Live TV: /live → Australia tab selected by default, channel count ~37 incl. ABC TV. Switch tab → new list loads. Open channel → player or graceful error (not blank/hang); press Z → channel changes; Esc closes.
7. Signature: /time-machine change decade → result set changes; /mood drag a slider → ordering changes; /roulette spin → decelerates, lands on title, countdown then playable.
8. My List: add from title page → appears in /my-list → persists after reload → remove works.
9. Adversarial: rapid live tab switching, spam roulette spin, /browse/bad-slug → 404 page, /watch/<nonplayable-id> → 404 or graceful, mobile viewport nav/rails. Console monitored throughout for hydration errors/unhandled rejections.

Pass = each stated observable holds; upstream HLS failures counted as pass if graceful error shown.
