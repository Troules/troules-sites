import type { CatalogItem, DailyRow, Summary } from "./types";

export type DayPoint = { day: string; volume: number; min: number; max: number; median: number };
export type Variant = { rank: number | null; subtype: string | null; summary: Summary | null; days: DayPoint[] };

/** Groups an item's history by (rank, subtype). Max rank first, then higher ranks, then subtype name. */
export function variants(item: Pick<CatalogItem, "maxRank">, summaries: Summary[], history: DailyRow[]): Variant[] {
  const groups = new Map<string, Variant>();
  const key = (rank: number | null, subtype: string | null) => `${rank}|${subtype}`;
  for (const [day, rank, subtype, volume, min, max, median] of history) {
    const k = key(rank, subtype);
    if (!groups.has(k)) groups.set(k, { rank, subtype, summary: null, days: [] });
    groups.get(k)!.days.push({ day, volume, min, max, median });
  }
  for (const s of summaries) {
    const k = key(s.rank, s.subtype);
    if (!groups.has(k)) groups.set(k, { rank: s.rank, subtype: s.subtype, summary: null, days: [] });
    groups.get(k)!.summary = s;
  }
  const weight = (v: Variant) => (v.rank === item.maxRank ? Infinity : (v.rank ?? -1));
  return [...groups.values()]
    .map((v) => ({ ...v, days: v.days.sort((a, b) => a.day.localeCompare(b.day)) }))
    .sort((a, b) => weight(b) - weight(a) || (a.subtype ?? "").localeCompare(b.subtype ?? ""));
}

/** Days within the last `n` calendar days ending at `asOf` (inclusive). */
export function lastDays(days: DayPoint[], asOf: string, n: number): DayPoint[] {
  const from = new Date(`${asOf}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - (n - 1));
  const cut = from.toISOString().slice(0, 10);
  return days.filter((d) => d.day >= cut && d.day <= asOf);
}
