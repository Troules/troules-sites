import type { CatalogItem, Row, Summary } from "./types";

export type Sort = "plat" | "price" | "volume" | "trend";

export const SORTS: { id: Sort; label: string; hint: string }[] = [
  { id: "plat", label: "Plat/day", hint: "Median price × completed trades per day, last 7 days" },
  { id: "price", label: "Price", hint: "Median sale price, last 7 days" },
  { id: "volume", label: "Volume", hint: "Completed trades per day, last 7 days" },
  { id: "trend", label: "7d trend", hint: "7-day median vs the 30 days before" },
];

/** Trend lists ignore thin markets, where one odd sale swings the median. */
export const MIN_TREND_VOLUME = 3;

/** Owner's rule: lists show each item at its max rank only (unranked items as they are). */
export function isMaxRank(s: Pick<Summary, "rank">, item: Pick<CatalogItem, "maxRank">): boolean {
  return item.maxRank == null || s.rank === item.maxRank;
}

export function toRows(summaries: Summary[], catalog: Map<string, CatalogItem>): Row[] {
  return summaries.flatMap((s) => {
    const item = catalog.get(s.slug);
    return item && isMaxRank(s, item)
      ? [{ ...s, name: item.name, thumb: item.thumb, kind: item.kind, maxRank: item.maxRank }]
      : [];
  });
}

const KEY: Record<Sort, (r: Row) => number> = {
  plat: (r) => r.plat7,
  price: (r) => r.price7,
  volume: (r) => r.vol7,
  trend: (r) => r.trend7 ?? -Infinity,
};

export function top(rows: Row[], sort: Sort, n = 10): Row[] {
  const pool = sort === "trend" ? rows.filter((r) => r.trend7 != null && r.vol7 >= MIN_TREND_VOLUME) : rows;
  return [...pool].sort((a, b) => KEY[sort](b) - KEY[sort](a) || a.name.localeCompare(b.name)).slice(0, n);
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
