import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cacheLife } from "next/cache";
import catalogJson from "@/fixtures/catalog.json";
import marketJson from "@/fixtures/market.json";
import { toRows } from "./rank";
import { marketProfile, rankUps, signalIndex, type MarketProfile, type RankUp } from "./signals";
import type { Book, CatalogItem, DailyRow, HourRow, Row, Summary } from "./types";
import type { IndexEntry } from "./search";

/**
 * Market data access. Builds read the committed sample in src/fixtures/ (regenerate: `pnpm fixtures`). Locally,
 * WF_DATA_DIR (set in .env.development.local, so `next dev` only) points at the full catalog from
 * `pnpm fixtures:full`, which is never committed. When the daily sweep lands (ADR 0009) these functions read
 * Supabase instead; their signatures stay the same, and "use cache" + cacheLife("hours") already matches a
 * once-a-day data source.
 */
type Market = {
  asOf: string;
  fetchedAt: string;
  summaries: Summary[];
  history: Record<string, DailyRow[]>;
  /** Missing in data swept before hourly buckets were kept. */
  hourly?: Record<string, HourRow[]>;
  orders: Record<string, Book>;
};

const DATA_DIR = process.env.WF_DATA_DIR;
const catalog = catalogJson as CatalogItem[];
const market = (DATA_DIR ? JSON.parse(readFileSync(resolve(DATA_DIR, "market.json"), "utf8")) : marketJson) as Market;
const hourly = market.hourly ?? {};
const bySlug = new Map(catalog.map((c) => [c.slug, c]));

export const IS_SAMPLE = !DATA_DIR;

export type MarketMeta = { asOf: string; fetchedAt: string; sample: boolean; tracked: number; catalogSize: number };

export async function getMeta(): Promise<MarketMeta> {
  "use cache";
  cacheLife("hours");
  return {
    asOf: market.asOf,
    fetchedAt: market.fetchedAt,
    sample: IS_SAMPLE,
    tracked: Object.keys(market.history).length,
    catalogSize: catalog.length,
  };
}

/** Max-rank rows for every item with recent trades. */
export async function getRows(): Promise<Row[]> {
  "use cache";
  cacheLife("hours");
  return toRows(market.summaries, bySlug, signalIndex(market.history));
}

/** Arcanes worth ranking up before selling. */
export async function getRankUps(): Promise<RankUp[]> {
  "use cache";
  cacheLife("hours");
  return rankUps(market.summaries, bySlug);
}

/** When the whole market pays more: by UTC hour (last 48 h) and by weekday (90 days). */
export async function getMarketProfile(): Promise<MarketProfile> {
  "use cache";
  cacheLife("hours");
  return marketProfile(market.history, hourly);
}

export async function getSearchIndex(): Promise<IndexEntry[]> {
  "use cache";
  cacheLife("hours");
  return catalog.map((c) => [c.slug, c.name, c.thumb, c.kind]);
}

/** Item slugs worth prerendering at build time: the ones with market data. */
export async function getTrackedSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  return Object.keys(market.history);
}

export type ItemMarket = {
  item: CatalogItem;
  summaries: Summary[];
  history: DailyRow[];
  hourly: HourRow[];
  book: Book;
};

export async function getItemMarket(slug: string): Promise<ItemMarket | null> {
  "use cache";
  cacheLife("hours");
  const item = bySlug.get(slug);
  if (!item) return null;
  return {
    item,
    summaries: market.summaries.filter((s) => s.slug === slug),
    history: market.history[slug] ?? [],
    hourly: hourly[slug] ?? [],
    book: market.orders[slug] ?? { sell: [], buy: [] },
  };
}
