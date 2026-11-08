import { NO_SIGNALS } from "./signals";
import type { CatalogItem, Row, Signals, Summary } from "./types";

export type Sort = "plat" | "price" | "volume" | "trend" | "high";

export const SORTS: { id: Sort; label: string; hint: string }[] = [
  { id: "plat", label: "Plat/day", hint: "Median price × completed trades per day, last 7 days" },
  { id: "price", label: "Price", hint: "Median sale price, last 7 days, items with at least one trade a day" },
  { id: "volume", label: "Volume", hint: "Completed trades per day, last 7 days" },
  { id: "trend", label: "7d trend", hint: "7-day median vs the 30 days before" },
  {
    id: "high",
    label: "Near 90d high",
    hint: "Good time to sell: the 7-day median is near the top of its last 90 days (ties count half, so flat prices sit mid-range)",
  },
];

/** The dashboard lists go this deep; the first rows are server-rendered, the rest load on scroll (/top/<sort>). */
export const TOP_LIMIT = 100;
export const FIRST_ROWS = 10;

/** Trend lists ignore thin markets, where one odd sale swings the median. */
export const MIN_TREND_VOLUME = 3;

/** Owner's rule: lists show each item at its max rank only (unranked items as they are). */
export function isMaxRank(s: Pick<Summary, "rank">, item: Pick<CatalogItem, "maxRank">): boolean {
  return item.maxRank == null || s.rank === item.maxRank;
}

export function toRows(
  summaries: Summary[],
  catalog: Map<string, CatalogItem>,
  signals: (s: Summary) => Signals = () => NO_SIGNALS,
): Row[] {
  return summaries.flatMap((s) => {
    const item = catalog.get(s.slug);
    return item && isMaxRank(s, item)
      ? [{ ...s, name: item.name, thumb: item.thumb, kind: item.kind, maxRank: item.maxRank, ...signals(s) }]
      : [];
  });
}

const KEY: Record<Sort, (r: Row) => number> = {
  plat: (r) => r.plat7,
  price: (r) => r.price7,
  volume: (r) => r.vol7,
  trend: (r) => r.trend7 ?? -Infinity,
  high: (r) => r.pos90 ?? -Infinity,
};

/** Trend and 90-day lists ignore thin markets, where one odd sale swings the median. */
const POOL: Partial<Record<Sort, (r: Row) => boolean>> = {
  // A price nobody pays twice a week is an asking price, not a market.
  price: (r) => r.vol7 >= 1,
  trend: (r) => r.trend7 != null && r.vol7 >= MIN_TREND_VOLUME,
  high: (r) => r.pos90 != null && r.vol7 >= MIN_TREND_VOLUME,
};

export function top(rows: Row[], sort: Sort, n = 10): Row[] {
  const pool = POOL[sort] ? rows.filter(POOL[sort]) : rows;
  // Many items share the same percentile, so plat/day breaks ties: the liquid ones are the ones you can sell.
  return [...pool]
    .sort((a, b) => KEY[sort](b) - KEY[sort](a) || b.plat7 - a.plat7 || a.name.localeCompare(b.name))
    .slice(0, n);
}

/** Biggest 7-day drop, for the summary tiles. */
export function biggestDrop(rows: Row[]): Row | undefined {
  return rows
    .filter((r) => r.trend7 != null && r.vol7 >= MIN_TREND_VOLUME)
    .sort((a, b) => a.trend7! - b.trend7!)
    .at(0);
}

export function variantLabel(r: Pick<Summary, "rank" | "subtype">, maxRank: number | null): string {
  const parts = [];
  if (maxRank != null && r.rank != null) parts.push(r.rank === maxRank ? `Rank ${r.rank} (max)` : `Rank ${r.rank}`);
  if (r.subtype) parts.push(r.subtype[0]!.toUpperCase() + r.subtype.slice(1));
  return parts.join(" · ") || "Unranked";
}
