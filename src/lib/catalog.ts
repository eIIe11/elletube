import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  GenrePage,
  GenreSummary,
  HomePayload,
  LiveCategory,
  LiveIndex,
  LibraryIndex,
  LibraryShelfPage,
} from "./types";

const DATA = join(process.cwd(), "public", "data");

async function readShard<T>(relative: string): Promise<T> {
  return JSON.parse(await readFile(join(DATA, relative), "utf8")) as T;
}

export const getHome = () => readShard<HomePayload>("home.json");
export const getGenres = () => readShard<GenreSummary[]>("genres.json");
export const getGenrePage = (slug: string, page: number) =>
  readShard<GenrePage>(`g/${slug}/${page}.json`);
export const getLiveIndex = () => readShard<LiveIndex>("live/index.json");
export const getLiveCategory = (slug: string) =>
  readShard<LiveCategory>(`live/${slug}.json`);

export const getLibraryIndex = () =>
  readShard<LibraryIndex>("library/index.json");
export const getLibraryShelf = (slug: string, page: number) =>
  readShard<LibraryShelfPage>(`library/${slug}/${page}.json`);

export const posterUrl = (id: string) =>
  `https://archive.org/services/img/${id}`;

export function formatRuntime(minutes: number | null): string {
  if (!minutes || minutes < 1) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
