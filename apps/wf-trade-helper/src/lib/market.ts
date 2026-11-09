import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cacheLife } from "next/cache";
import catalogJson from "@/fixtures/catalog.json";
import { SORTS, TOP_LIMIT, toRows, top } from "./rank";
import { marketProfile, rankUps, signalIndex, type MarketProfile, type RankUp } from "./signals";
import type { Book, CatalogItem, DailyRow, HourRow, Row, Summary } from "./types";
import type { IndexEntry } from "./search";

/**
 * Market data access. Everything comes from src/generated/market.json, which scripts/market-data.mjs writes before
 * `next dev` and `next build`: the Supabase snapshot in production (refreshed by the daily sweep's deploy hook), the
 * full local catalog with WF_DATA_DIR, or the committed sample (ADR 0009). It is read from disk rather than imported,
 * so TypeScript never infers types from a 15 MB file; next.config.ts traces it into the server functions.
 */
type Market = {
  asOf: string;
  fetchedAt: string;
  summaries: Summary[];
  history: Record<string, DailyRow[]>;
  /** Missing in data swept before hourly buckets were kept. */
  hourly?: Record<string, HourRow[]>;
  orders: Record<string, Book>;
  /** Set by scripts/market-data.mjs; missing means the committed sample. */
  source?: "supabase" | "local";
};

export const MARKET_FILE = "src/generated/market.json";

const catalog = catalogJson as CatalogItem[];
const market = JSON.parse(readFileSync(resolve(process.cwd(), MARKET_FILE), "utf8")) as Market;
const hourly = market.hourly ?? {};
const bySlug = new Map(catalog.map((c) => [c.slug, c]));

export const IS_SAMPLE = !market.source;

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

/** Every item with market data (the sitemap). */
export async function getTrackedSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  return Object.keys(market.history);
}

/**
 * Item pages prerendered at build time: the ones the home page links to (every top-100 list and the rank-ups).
 * Prerendering all ~3,900 would add ~850 MB to every daily deployment; the rest render on first visit and stay
 * cached.
 */
export async function getPrerenderSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  const rows = await getRows();
  const listed = SORTS.flatMap((s) => top(rows, s.id, TOP_LIMIT).map((r) => r.slug));
  return [...new Set([...listed, ...(await getRankUps()).map((r) => r.slug)])];
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
