import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cacheLife } from "next/cache";
import catalogJson from "@/fixtures/catalog.json";
import setsJson from "@/fixtures/sets.json";
import { ducatRows, type DucatRow } from "./ducats";
import { isMaxRank, movers, SORTS, TOP_LIMIT, toRows, top } from "./rank";
import { setOfPart, setRows, type SetRow } from "./sets";
import { marketProfile, rankUps, signalIndex, type MarketProfile, type RankUp } from "./signals";
import type { PriceIndex, PriceVariant } from "./stash";
import type { Book, CatalogItem, DailyRow, HourRow, Row, SetParts, Summary } from "./types";
import type { IndexEntry } from "./search";
import type { Price } from "./vosfor";
import { COLLECTIONS, slugOf } from "./vosfor-data";

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
const sets = setsJson as unknown as SetParts;
const partToSet = setOfPart(sets);

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

/** Rank-0 7-day medians of every arcane Loid's collections can give: packs hand out unranked copies. */
export async function getVosforPrices(): Promise<Price[]> {
  "use cache";
  cacheLife("hours");
  const at = new Map(market.summaries.filter((s) => s.subtype == null).map((s) => [`${s.slug}|${s.rank}`, s]));
  const names = new Set(COLLECTIONS.flatMap((c) => c.pools.flatMap((p) => p.arcanes)));
  return [...names].map((name) => {
    const slug = slugOf(name);
    const item = bySlug.get(slug);
    const r0 = at.get(`${slug}|0`);
    const max = item?.maxRank != null ? at.get(`${slug}|${item.maxRank}`) : undefined;
    return {
      slug,
      name,
      thumb: item?.thumb ?? null,
      price: r0?.price7 ?? null,
      vol: r0?.vol7 ?? 0,
      maxRank: item?.maxRank ?? null,
      maxPrice: max?.price7 ?? null,
      maxVol: max?.vol7 ?? 0,
    };
  });
}

/** Prime parts and sets with a ducat value and a daily market (unsorted: the page ranks them both ways). */
export async function getDucats(): Promise<DucatRow[]> {
  "use cache";
  cacheLife("hours");
  return ducatRows(await getRows(), (slug) => bySlug.get(slug)?.ducats);
}

/** Every set with its parts and their prices. */
export async function getSets(): Promise<SetRow[]> {
  "use cache";
  cacheLife("hours");
  return setRows(sets, await getRows(), bySlug);
}

/** The set an item belongs to (or is), for the "set and parts" panel of item pages. */
export async function getSetOf(slug: string): Promise<SetRow | null> {
  "use cache";
  cacheLife("hours");
  const set = sets[slug] ? slug : partToSet.get(slug);
  if (!set) return null;
  return setRows({ [set]: sets[set]! }, await getRows(), bySlug)[0] ?? null;
}

const round = (n: number, digits: number) => Number(n.toFixed(digits));

/**
 * Every priced (item, rank, subtype) as a compact tuple, for the stash page (/prices.json). Max rank first, so
 * the first variant is the one the lists show.
 */
export async function getPriceIndex(): Promise<PriceIndex> {
  "use cache";
  cacheLife("hours");
  const signals = signalIndex(market.history);
  const index: Record<string, { max: boolean; v: PriceVariant }[]> = {};
  for (const s of market.summaries) {
    const item = bySlug.get(s.slug);
    if (!item) continue;
    const pos = signals(s).pos90;
    (index[s.slug] ??= []).push({
      max: isMaxRank(s, item),
      v: [
        s.rank,
        s.subtype,
        round(s.price7, 1),
        round(s.vol7, 1),
        s.trend7 == null ? null : round(s.trend7, 1),
        pos == null ? null : round(pos, 2),
      ],
    });
  }
  return Object.fromEntries(
    Object.entries(index).map(([slug, vs]) => [
      slug,
      vs
        .sort(
          (a, b) =>
            Number(b.max) - Number(a.max) ||
            (b.v[0] ?? -1) - (a.v[0] ?? -1) ||
            (a.v[1] ?? "").localeCompare(b.v[1] ?? ""),
        )
        .map((x) => x.v),
    ]),
  );
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
 * Item pages prerendered at build time: the ones the home page links to (every unfiltered top-100 list, the
 * rank-ups and the movers).
 * Prerendering all ~3,900 would add ~850 MB to every daily deployment; the rest render on first visit and stay
 * cached.
 */
export async function getPrerenderSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  const rows = await getRows();
  const listed = SORTS.flatMap((s) => top(rows, s.id, TOP_LIMIT).map((r) => r.slug));
  const moving = movers(rows);
  return [
    ...new Set([
      ...listed,
      ...(await getRankUps()).map((r) => r.slug),
      ...[...moving.up, ...moving.down].map((r) => r.slug),
    ]),
  ];
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
