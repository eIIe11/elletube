export type Kind = "movie" | "series" | "documentary" | "live";

/** Compact card shape emitted by scripts/prepare.mjs. */
export type Card = {
  i: string;
  t: string;
  y: number | null;
  k: Kind;
  r: number | null;
  g: string;
};

export type SpotlightCard = Card & { o: string; gs: string[] };

export type GenreSummary = {
  name: string;
  slug: string;
  count: number;
  pages: number;
};

export type GenrePage = {
  name: string;
  slug: string;
  page: number;
  pages: number;
  total: number;
  items: Card[];
};

export type HomePayload = {
  spotlight: SpotlightCard[];
  trending: Card[];
  rows: { name: string; slug: string; items: Card[] }[];
};

export type LiveChannel = {
  id: string;
  kind: "live";
  title: string;
  url: string;
  height: number;
  country: string;
  languages: string[];
  logo: string | null;
  genres: string[];
};

export type LiveIndex = {
  categories: { name: string; slug: string; count: number }[];
  countries: { code: string; slug: string; count: number }[];
  featured: LiveChannel[];
  total: number;
};

export type LiveCategory = {
  name: string;
  slug: string;
  channels: LiveChannel[];
};

export type TitleDetail = {
  id: string;
  title: string;
  year: number | null;
  overview: string;
  creator: string;
  runtime: number | null;
  license: string;
  tags: string[];
  streamUrl: string | null;
  poster: string;
};
