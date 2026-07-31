import { redirect } from "next/navigation";
import { getGenres, getGenrePage } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** Shuffle: jumps straight into a random title from a random category. */
export default async function SurprisePage() {
  const genres = await getGenres();
  const genre = genres[Math.floor(Math.random() * genres.length)];
  const page = Math.floor(Math.random() * Math.min(genre.pages, 20));
  const data = await getGenrePage(genre.slug, page);
  const pick = data.items[Math.floor(Math.random() * data.items.length)];
  redirect(`/title/${encodeURIComponent(pick.i)}`);
}
