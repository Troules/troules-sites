import { describe, expect, it } from "vitest";
import catalog from "@/fixtures/catalog.json";
import { COLLECTIONS, DISSOLVE_YIELD, PACK_COST, slugOf } from "./vosfor-data";
import {
  atLeastOne,
  dissolves,
  drops,
  packValue,
  packYield,
  packsFor,
  simulate,
  valueCollections,
  vosforValue,
  type Price,
} from "./vosfor";

const slugs = new Set(catalog.map((c) => c.slug));
const price = (slug: string, p: number | null): [string, Price] => [
  slug,
  { slug, name: slug, thumb: null, price: p, vol: 10 },
];

describe("collection data", () => {
  it.each(COLLECTIONS)("$name: pool chances sum to 1", (c) => {
    expect(c.pools.reduce((a, p) => a + p.chance, 0)).toBeCloseTo(1, 9);
  });

  it.each(COLLECTIONS)("$name: every arcane has a Vosfor yield and a warframe.market slug", (c) => {
    for (const name of c.pools.flatMap((p) => p.arcanes)) {
      expect(DISSOLVE_YIELD.get(name), name).toBeGreaterThan(0);
      expect(slugs.has(slugOf(name)), name).toBe(true);
    }
  });

  it.each(COLLECTIONS)("$name: a fully dissolved pack returns less than it costs", (c) => {
    expect(packYield(drops(c, new Map()))).toBeLessThan(PACK_COST);
  });
});

const steel = COLLECTIONS.find((c) => c.id === "steel")!;

describe("pack value", () => {
  it("is 3 pulls × the chance-weighted rank-0 price when selling", () => {
    // 11 equally likely arcanes; only one is worth 110p.
    const ds = drops(steel, new Map([price("arcane_tanker", 110)]));
    expect(packValue(ds)).toBeCloseTo(3 * (110 / 11));
  });

  it("finds the Vosfor fixed point and recycles only the copies worth less than their Vosfor", () => {
    const ds = drops(steel, new Map([price("arcane_tanker", 110)]));
    const lambda = vosforValue(ds);
    expect(lambda * PACK_COST).toBeCloseTo(packValue(ds, lambda), 6);
    expect(packValue(ds, lambda)).toBeGreaterThan(packValue(ds));
    const tanker = ds.find((d) => d.slug === "arcane_tanker")!;
    expect(dissolves(tanker, lambda)).toBe(false);
    expect(ds.filter((d) => dissolves(d, lambda))).toHaveLength(10);
  });

  it("ranks every collection and counts priced arcanes", () => {
    const values = valueCollections(COLLECTIONS, new Map([price("arcane_energize", 7)]));
    const eidolon = values.find((v) => v.id === "eidolon")!;
    expect(eidolon.priced).toBe(1);
    expect(eidolon.legendary).toBeCloseTo(1 - 0.95 ** 3);
    for (const v of values) expect(v.recyclePack).toBeGreaterThanOrEqual(v.sellPack - 1e-9);
  });
});

describe("probabilities", () => {
  it("gives the chance of at least one copy over several packs", () => {
    expect(atLeastOne(0.5)).toBeCloseTo(0.875);
    expect(atLeastOne(0.1, 2)).toBeCloseTo(1 - 0.9 ** 6);
  });

  it("counts the packs needed for a target chance", () => {
    expect(packsFor(0.5, 0.875)).toBe(1);
    expect(packsFor(1 / 60, 0.9)).toBe(46);
    expect(atLeastOne(1 / 60, 46)).toBeGreaterThanOrEqual(0.9);
    expect(atLeastOne(1 / 60, 45)).toBeLessThan(0.9);
    expect(packsFor(0, 0.5)).toBe(Infinity);
  });
});

describe("simulation", () => {
  const ds = drops(steel, new Map([price("arcane_tanker", 110), price("primary_merciless", 10)]));

  it("averages close to packs × pack value when selling, and is reproducible", () => {
    const out = simulate(ds, 10_000, "sell", 0);
    expect(out.packs).toBe(50);
    expect(out.mean).toBeGreaterThan(50 * packValue(ds) * 0.95);
    expect(out.mean).toBeLessThan(50 * packValue(ds) * 1.05);
    expect(out.p10).toBeLessThanOrEqual(out.p50);
    expect(out.p50).toBeLessThanOrEqual(out.p90);
    expect(simulate(ds, 10_000, "sell", 0)).toEqual(out);
  });

  it("opens more packs and earns about Vosfor × λ when recycling", () => {
    const lambda = vosforValue(ds);
    const out = simulate(ds, 10_000, "recycle", lambda);
    expect(out.packs).toBeGreaterThan(50);
    // Leftover Vosfor (< one pack) is worth nothing, so the mean sits a little under the bound.
    expect(out.mean).toBeLessThan(10_000 * lambda * 1.03);
    expect(out.mean).toBeGreaterThan(10_000 * lambda * 0.9);
  });

  it("buys nothing below the price of a pack", () => {
    expect(simulate(ds, 199, "sell", 0)).toMatchObject({ mean: 0, packs: 0, legendary: 0 });
  });
});
