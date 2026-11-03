import "server-only";
import { cacheLife } from "next/cache";
import catalogJson from "@/fixtures/catalog.json";
import marketJson from "@/fixtures/market.json";
import { toRows } from "./rank";
import type { Book, CatalogItem, DailyRow, Row, Summary } from "./types";
import type { IndexEntry } from "./search";

/**
 * Market data access. Today every call reads the sample in src/fixtures/ (regenerate: `pnpm fixtures`).
 * When the daily sweep lands (ADR 0009) these functions read Supabase instead; their signatures stay the same,
 * and "use cache" + cacheLife("hours") already matches a once-a-day data source.
 */
type Market = {
  asOf: string;
  fetchedAt: string;
  summaries: Summary[];
  history: Record<string, DailyRow[]>;
  orders: Record<string, Book>;
};

const catalog = catalogJson as CatalogItem[];
const market = marketJson as unknown as Market;
const bySlug = new Map(catalog.map((c) => [c.slug, c]));

export const IS_SAMPLE = true;

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
  return toRows(market.summaries, bySlug);
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

export type ItemMarket = { item: CatalogItem; summaries: Summary[]; history: DailyRow[]; book: Book };

export async function getItemMarket(slug: string): Promise<ItemMarket | null> {
  "use cache";
  cacheLife("hours");
  const item = bySlug.get(slug);
  if (!item) return null;
  return {
    item,
    summaries: market.summaries.filter((s) => s.slug === slug),
    history: market.history[slug] ?? [],
    book: market.orders[slug] ?? { sell: [], buy: [] },
  };
}
