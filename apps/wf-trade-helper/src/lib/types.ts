/** Shapes shared by the fixtures (sweeper/wfm_sweep.py) and, later, the Supabase tables (ADR 0009). */

export type CatalogItem = {
  slug: string;
  name: string;
  /** Path under ASSET_BASE, content-hashed by warframe.market. */
  thumb: string | null;
  kind: string;
  maxRank: number | null;
  subtypes: string[] | null;
  /** What Baro Ki'Teer's kiosk pays for it (prime parts and sets); null or missing for everything else. */
  ducats?: number | null;
};

/** Set slug → [part slug, copies of it in the set], from `pnpm catalog` (src/fixtures/sets.json). */
export type SetParts = Record<string, [string, number][]>;

/** Last-7-days numbers for one (item, rank, subtype), from completed trades. */
export type Summary = {
  slug: string;
  rank: number | null;
  subtype: string | null;
  /** Volume-weighted mean of the daily medians. */
  price7: number;
  /** Completed trades per day. */
  vol7: number;
  /** Platinum traded per day: Σ volume × median / 7. */
  plat7: number;
  /** price7 vs the 30 days before, in percent. Null when there were no earlier trades. */
  trend7: number | null;
  last_day: string;
  /** Daily median for the last 30 days; null on days without trades. */
  spark30: (number | null)[];
};

/** [day, rank, subtype, volume, min, max, median] */
export type DailyRow = [string, number | null, string | null, number, number, number, number];

/** [UTC hour "YYYY-MM-DDTHH", rank, subtype, volume, median]: the last 48 hours of completed trades. */
export type HourRow = [string, number | null, string | null, number, number];

export type Order = {
  platinum: number;
  quantity: number;
  rank: number | null;
  subtype: string | null;
  reputation: number;
  status: string;
};

export type Book = { sell: Order[]; buy: Order[] };

/** 90-day context for one (item, rank, subtype); null fields when it traded on fewer than MIN_SIGNAL_DAYS days. */
export type Signals = {
  /** Where price7 sits among the daily medians of the last 90 days: 0 = cheapest day, 1 = dearest. */
  pos90: number | null;
  lo90: number | null;
  hi90: number | null;
  /** Coefficient of variation of the daily medians (standard deviation / mean). */
  cv90: number | null;
};

export type Row = Summary & Pick<CatalogItem, "name" | "thumb" | "kind" | "maxRank"> & Signals;

export const ASSET_BASE = "https://warframe.market/static/assets/";
