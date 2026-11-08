import type { CatalogItem, DailyRow, HourRow, Signals, Summary } from "./types";

/**
 * Price signals computed from the stored history: where today's price sits in its 90-day range, how much it
 * moves, when in the week and the day it sells higher, and whether ranking an arcane up pays.
 * Every function is pure so the same maths can move to SQL views when the data lives in Supabase (ADR 0009).
 */

/** Fewer trading days than this and a percentile or a volatility says more about luck than about the market. */
export const MIN_SIGNAL_DAYS = 20;

export const NO_SIGNALS: Signals = { pos90: null, lo90: null, hi90: null, cv90: null };

const key = (slug: string, rank: number | null, subtype: string | null) => `${slug}|${rank}|${subtype}`;

/** Percentile rank of `price` among `medians`, ties counted half (a flat price sits at 0.5, not at the top). */
export function percentile(medians: number[], price: number): number {
  let below = 0;
  let equal = 0;
  for (const m of medians) {
    if (m < price) below++;
    else if (m === price) equal++;
  }
  return (below + equal / 2) / medians.length;
}

export function signalsFor(medians: number[], price7: number): Signals {
  if (medians.length < MIN_SIGNAL_DAYS) return NO_SIGNALS;
  const mean = medians.reduce((a, b) => a + b, 0) / medians.length;
  const sd = Math.sqrt(medians.reduce((a, m) => a + (m - mean) ** 2, 0) / medians.length);
  return {
    pos90: percentile(medians, price7),
    lo90: Math.min(...medians),
    hi90: Math.max(...medians),
    cv90: mean ? sd / mean : null,
  };
}

/** Signals for every summary, from the 90-day history of all items. */
export function signalIndex(
  history: Record<string, DailyRow[]>,
): (s: Pick<Summary, "slug" | "rank" | "subtype" | "price7">) => Signals {
  const medians = new Map<string, number[]>();
  for (const [slug, rows] of Object.entries(history))
    for (const [, rank, subtype, , , , median] of rows) {
      const k = key(slug, rank, subtype);
      if (!medians.has(k)) medians.set(k, []);
      medians.get(k)!.push(median);
    }
  return (s) => signalsFor(medians.get(key(s.slug, s.rank, s.subtype)) ?? [], s.price7);
}

export type Volatility = { label: "Stable" | "Moderate" | "Volatile"; hint: string };

export function volatility(cv: number): Volatility {
  const pct = `daily median moves ±${Math.round(cv * 100)}%`;
  if (cv < 0.1) return { label: "Stable", hint: `${pct}: listing at the median is safe` };
  if (cv < 0.25) return { label: "Moderate", hint: `${pct}` };
  return { label: "Volatile", hint: `${pct}: list high and wait, or sell into a spike` };
}

/** One bar of a profile: price vs the usual price, in percent, from `trades` completed trades. */
export type Bucket = { pct: number | null; trades: number };

type Point = { volume: number; median: number };

/** Volume-weighted mean of (ratio - 1) per bucket; buckets with fewer than `min` samples stay null. */
function profile(n: number, samples: { bucket: number; ratio: number; volume: number }[], min: number): Bucket[] {
  const acc = Array.from({ length: n }, () => ({ w: 0, sum: 0, samples: 0 }));
  for (const s of samples) {
    const a = acc[s.bucket]!;
    a.w += s.volume;
    a.sum += s.volume * (s.ratio - 1);
    a.samples++;
  }
  return acc.map((a) => ({ pct: a.samples >= min && a.w ? (a.sum / a.w) * 100 : null, trades: a.w }));
}

const vwap = (pts: Point[]) => {
  const v = pts.reduce((a, p) => a + p.volume, 0);
  return v ? pts.reduce((a, p) => a + p.volume * p.median, 0) / v : 0;
};

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
/** Each weekday needs this many weeks of trades before its bar is shown. */
export const MIN_WEEKS = 4;

/**
 * Day-of-week profile (UTC days, Monday first). Each day is compared with the volume-weighted mean of the 7 days
 * centred on it, so a price that rose all quarter does not make the last weekday look expensive.
 */
export function weekdayProfile(days: (Point & { day: string })[]): Bucket[] {
  const t = days.map((d) => Date.parse(`${d.day}T00:00:00Z`) / 86_400_000);
  const first = Math.min(...t);
  const last = Math.max(...t);
  const samples = days.flatMap((d, i) => {
    // The first and last 3 days have a one-sided window, which would bias them on a trending price.
    if (t[i]! - first < 3 || last - t[i]! < 3) return [];
    const near = days.filter((_, j) => Math.abs(t[j]! - t[i]!) <= 3);
    const base = vwap(near);
    if (near.length < 4 || !base) return [];
    const bucket = (new Date(t[i]! * 86_400_000).getUTCDay() + 6) % 7;
    return [{ bucket, ratio: d.median / base, volume: d.volume }];
  });
  return profile(7, samples, MIN_WEEKS);
}

/** Hour-of-day profile (UTC) over the last 48 hours, each hour vs the 48-hour volume-weighted price. */
export function hourProfile(hours: (Point & { hour: string })[]): Bucket[] {
  const base = vwap(hours);
  if (!base) return Array.from({ length: 24 }, () => ({ pct: null, trades: 0 }));
  const samples = hours.map((h) => ({
    bucket: Number(h.hour.slice(11, 13)),
    ratio: h.median / base,
    volume: h.volume,
  }));
  return profile(24, samples, 1);
}

/** Evening peaks in UTC, northern winter time (Europe CET 18–24, US Eastern 20–01, East Asia and Australia 18–23). */
export const REGIONS = [
  { id: "europe", label: "Europe evening", from: 17, to: 23 },
  { id: "americas", label: "Americas evening", from: 1, to: 7 },
  { id: "asia", label: "Asia & Oceania evening", from: 9, to: 15 },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

/** Trade-weighted price index over a region's evening hours. */
export function regionIndex(hours: Bucket[], r: { from: number; to: number }): Bucket {
  let w = 0;
  let sum = 0;
  for (let h = r.from; h < r.to; h++) {
    const b = hours[h]!;
    if (b.pct == null) continue;
    w += b.trades;
    sum += b.trades * b.pct;
  }
  return { pct: w ? sum / w : null, trades: w };
}

/** Variants with fewer trades than this in 48 hours are too thin to say anything about an hour. */
export const MIN_MARKET_HOURLY_TRADES = 24;

export type MarketProfile = { hours: Bucket[]; weekdays: Bucket[]; items: { hourly: number; weekly: number } };

/**
 * The whole market's profile: for each hour (or weekday), the median across items of their own profile, so a few
 * huge arcanes do not outvote everything else. `trades` is the total traded in that bucket.
 */
export function marketProfile(history: Record<string, DailyRow[]>, hourly: Record<string, HourRow[]>): MarketProfile {
  const byVariant = <T>(rows: Record<string, T[]>, k: (slug: string, row: T) => string) => {
    const m = new Map<string, T[]>();
    for (const [slug, rs] of Object.entries(rows))
      for (const r of rs) {
        const id = k(slug, r);
        if (!m.has(id)) m.set(id, []);
        m.get(id)!.push(r);
      }
    return [...m.values()];
  };
  const hourProfiles = byVariant(hourly, (s, r) => key(s, r[1], r[2]))
    .map((rs) => rs.map(([hour, , , volume, median]) => ({ hour, volume, median })))
    .filter((pts) => pts.reduce((a, p) => a + p.volume, 0) >= MIN_MARKET_HOURLY_TRADES)
    .map(hourProfile);
  const dayProfiles = byVariant(history, (s, r) => key(s, r[1], r[2]))
    .filter((rs) => rs.length >= MIN_WEEKS * 7)
    .map((rs) => weekdayProfile(rs.map(([day, , , volume, , , median]) => ({ day, volume, median }))));
  return {
    hours: combine(hourProfiles, 24),
    weekdays: combine(dayProfiles, 7),
    items: { hourly: hourProfiles.length, weekly: dayProfiles.length },
  };
}

function combine(profiles: Bucket[][], n: number): Bucket[] {
  return Array.from({ length: n }, (_, i) => {
    const pcts = profiles.flatMap((p) => (p[i]!.pct == null ? [] : [p[i]!.pct!])).sort((a, b) => a - b);
    const trades = profiles.reduce((a, p) => a + p[i]!.trades, 0);
    if (!pcts.length) return { pct: null, trades };
    const mid = pcts.length >> 1;
    return { pct: pcts.length % 2 ? pcts[mid]! : (pcts[mid - 1]! + pcts[mid]!) / 2, trades };
  });
}

/** Copies of rank 0 fused into one max-rank arcane: rank r takes r + 1 copies, so 1 + 2 + … + (max + 1). */
export const copiesToMax = (maxRank: number) => ((maxRank + 1) * (maxRank + 2)) / 2;

export type RankUp = Pick<CatalogItem, "slug" | "name" | "thumb" | "maxRank"> & {
  copies: number;
  /** 7-day medians. */
  r0: number;
  max: number;
  cost: number;
  profit: number;
  /** Trades per day, rank 0 (can you buy the copies?) and max rank (will it sell?). */
  vol0: number;
  volMax: number;
};

/** Thin markets give medians nobody can actually buy or sell at. */
export const MIN_RANKUP_VOLUME = { r0: 3, max: 1 };

/** Arcanes where buying rank-0 copies at the median and selling the max-rank result at the median pays, best first. */
export function rankUps(summaries: Summary[], catalog: Map<string, CatalogItem>): RankUp[] {
  const at = new Map(summaries.filter((s) => s.subtype == null).map((s) => [`${s.slug}|${s.rank}`, s]));
  return [...catalog.values()]
    .flatMap((item) => {
      if (item.kind !== "Arcane" || !item.maxRank) return [];
      const lo = at.get(`${item.slug}|0`);
      const hi = at.get(`${item.slug}|${item.maxRank}`);
      if (!lo || !hi || lo.vol7 < MIN_RANKUP_VOLUME.r0 || hi.vol7 < MIN_RANKUP_VOLUME.max) return [];
      const copies = copiesToMax(item.maxRank);
      const cost = copies * lo.price7;
      return [
        {
          slug: item.slug,
          name: item.name,
          thumb: item.thumb,
          maxRank: item.maxRank,
          copies,
          r0: lo.price7,
          max: hi.price7,
          cost,
          profit: hi.price7 - cost,
          vol0: lo.vol7,
          volMax: hi.vol7,
        },
      ];
    })
    .filter((r) => r.profit > 0)
    .sort((a, b) => b.profit - a.profit || a.name.localeCompare(b.name));
}
