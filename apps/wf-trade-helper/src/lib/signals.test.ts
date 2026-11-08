import { describe, expect, it } from "vitest";
import { toRows, top } from "./rank";
import {
  copiesToMax,
  hourProfile,
  marketProfile,
  MIN_SIGNAL_DAYS,
  percentile,
  rankUps,
  regionIndex,
  signalIndex,
  signalsFor,
  volatility,
  weekdayProfile,
} from "./signals";
import type { CatalogItem, DailyRow, HourRow, Summary } from "./types";

const item = (slug: string, maxRank: number | null, kind = "Arcane"): CatalogItem => ({
  slug,
  name: slug,
  thumb: null,
  kind,
  maxRank,
  subtypes: null,
});
const sum = (slug: string, rank: number | null, price7: number, vol7 = 10): Summary => ({
  slug,
  rank,
  subtype: null,
  price7,
  vol7,
  plat7: price7 * vol7,
  trend7: 0,
  last_day: "2026-11-07",
  spark30: [],
});
/** `n` consecutive days ending 2026-11-08 (a Sunday), oldest first. */
const days = (n: number, median: (i: number, weekday: number) => number, volume = 5) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(2026, 10, 8 - (n - 1 - i)));
    return { day: d.toISOString().slice(0, 10), volume, median: median(i, (d.getUTCDay() + 6) % 7) };
  });

describe("percentile", () => {
  it("counts ties half, so a flat price sits mid-range", () => {
    expect(percentile([2, 2, 2, 2], 2)).toBe(0.5);
    expect(percentile([1, 2, 3, 4], 5)).toBe(1);
    expect(percentile([1, 2, 3, 4], 2)).toBe(0.375);
  });
});

describe("signalsFor", () => {
  it("needs enough trading days", () => {
    expect(signalsFor([1, 2, 3], 3).pos90).toBeNull();
  });

  it("gives position, range and volatility", () => {
    const meds = Array.from({ length: MIN_SIGNAL_DAYS }, (_, i) => (i % 2 ? 90 : 110));
    const s = signalsFor(meds, 110);
    expect(s).toMatchObject({ pos90: 0.75, lo90: 90, hi90: 110 });
    expect(s.cv90).toBeCloseTo(0.1);
    expect(volatility(s.cv90!).label).toBe("Moderate");
    expect(volatility(0.02).label).toBe("Stable");
    expect(volatility(0.4).label).toBe("Volatile");
  });

  it("feeds the near-90d-high list, thin markets left out", () => {
    const hist = (median: number): DailyRow[] =>
      days(30, (i) => median + i).map((d) => [d.day, null, null, d.volume, 0, 0, d.median]);
    const history = { up: hist(10), flat: hist(10), thin: hist(10) };
    const catalog = new Map(["up", "flat", "thin"].map((s) => [s, item(s, null, "Set")]));
    const rows = toRows(
      [sum("up", null, 50), sum("flat", null, 20), sum("thin", null, 50, 1)],
      catalog,
      signalIndex(history),
    );
    expect(top(rows, "high").map((r) => r.slug)).toEqual(["up", "flat"]);
  });
});

describe("weekdayProfile", () => {
  it("finds a weekend premium on a rising price", () => {
    const p = weekdayProfile(days(56, (i, wd) => (100 + i) * (wd >= 5 ? 1.1 : 1)));
    expect(p).toHaveLength(7);
    expect(p[5]!.pct!).toBeGreaterThan(5);
    expect(p[1]!.pct!).toBeLessThan(0);
    // The trend alone would make Sunday (the last day) look dear; the centred baseline cancels it.
    const trendOnly = weekdayProfile(days(56, (i) => 100 + i * 2));
    for (const b of trendOnly) expect(Math.abs(b.pct!)).toBeLessThan(0.5);
  });

  it("hides weekdays seen fewer than 4 times", () => {
    expect(weekdayProfile(days(14, () => 10)).every((b) => b.pct == null)).toBe(true);
  });
});

describe("hourProfile and regionIndex", () => {
  const h = (hour: number, median: number, volume = 2) => ({
    hour: `2026-11-07T${String(hour).padStart(2, "0")}`,
    volume,
    median,
  });

  it("compares each UTC hour with the 48-hour price", () => {
    const p = hourProfile([h(3, 120), h(18, 80)]);
    expect(p[3]!.pct).toBeCloseTo(20);
    expect(p[3]!.trades).toBe(2);
    expect(p[18]!.pct).toBeCloseTo(-20);
    expect(p[10]!.pct).toBeNull();
    expect(regionIndex(p, { from: 1, to: 7 }).pct).toBeCloseTo(20);
    expect(regionIndex(p, { from: 9, to: 15 }).pct).toBeNull();
  });

  it("takes the market median across items, not the biggest item", () => {
    const rows = (median: (hr: number) => number, volume: number): HourRow[] =>
      Array.from({ length: 24 }, (_, hr) => [
        `2026-11-07T${String(hr).padStart(2, "0")}`,
        null,
        null,
        volume,
        median(hr),
      ]);
    const hourly = {
      whale: rows((hr) => (hr === 3 ? 200 : 100), 100),
      a: rows(() => 10, 2),
      b: rows(() => 10, 2),
    };
    const m = marketProfile({}, hourly);
    expect(m.items.hourly).toBe(3);
    expect(m.hours[3]!.pct).toBe(0);
    expect(m.hours[3]!.trades).toBe(104);
  });
});

describe("rankUps", () => {
  it("counts the copies a max-rank arcane needs", () => {
    expect(copiesToMax(5)).toBe(21);
    expect(copiesToMax(3)).toBe(10);
  });

  it("keeps profitable, liquid arcanes, best first", () => {
    const catalog = new Map(
      [item("good", 5), item("better", 3), item("loss", 5), item("thin", 5), item("mod", 10, "Mod")].map((c) => [
        c.slug,
        c,
      ]),
    );
    const r = rankUps(
      [
        sum("good", 0, 10),
        sum("good", 5, 300),
        sum("better", 0, 10),
        sum("better", 3, 250),
        sum("loss", 0, 10),
        sum("loss", 5, 150),
        sum("thin", 0, 10, 1),
        sum("thin", 5, 900),
        sum("mod", 0, 1),
        sum("mod", 10, 500),
      ],
      catalog,
    );
    expect(r.map((x) => [x.slug, x.copies, x.profit])).toEqual([
      ["better", 10, 150],
      ["good", 21, 90],
    ]);
  });
});
