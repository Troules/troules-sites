import { DISSOLVE_YIELD, PACK_COST, PULLS_PER_PACK, slugOf, type Collection, type Rarity } from "./vosfor-data";

/**
 * Vosfor maths, all pure. Two ways to spend: sell every arcane a pack gives ("sell"), or dissolve the ones worth
 * less as Vosfor than as plat and buy more packs with it ("recycle"). Recycling needs a plat value for one Vosfor:
 * if a pack is worth V plat, a Vosfor is worth λ = V / 200, and V itself depends on λ through every dissolved copy.
 * That λ is a fixed point, found by iteration (see vosforValue).
 */

export type Price = { slug: string; name: string; thumb: string | null; price: number | null; vol: number };

export type Drop = Price & {
  rarity: Rarity;
  /** Chance per slot; a pack has PULLS_PER_PACK independent slots. */
  chance: number;
  /** Vosfor from dissolving one unranked copy. */
  yield: number;
};

export type Strategy = "sell" | "recycle";

/** Every arcane a collection can give, with its rank-0 7-day median (null without recent trades). */
export function drops(c: Collection, prices: ReadonlyMap<string, Price>): Drop[] {
  return c.pools.flatMap((pool) =>
    pool.arcanes.map((name) => {
      const slug = slugOf(name);
      const p = prices.get(slug) ?? { slug, name, thumb: null, price: null, vol: 0 };
      return {
        ...p,
        name,
        rarity: pool.rarity,
        chance: pool.chance / pool.arcanes.length,
        yield: DISSOLVE_YIELD.get(name) ?? 0,
      };
    }),
  );
}

/** What one copy is worth when a Vosfor is worth `lambda` plat: sold, or dissolved if that pays more. */
export const copyValue = (d: Drop, lambda: number) => Math.max(d.price ?? 0, d.yield * lambda);

/** Should this copy be dissolved rather than sold? Unpriced arcanes always are, once Vosfor has a value. */
export const dissolves = (d: Drop, lambda: number) => lambda > 0 && d.yield * lambda > (d.price ?? 0);

/** Expected plat from one pack. lambda = 0 is "sell everything". */
export function packValue(ds: readonly Drop[], lambda = 0): number {
  return PULLS_PER_PACK * ds.reduce((a, d) => a + d.chance * copyValue(d, lambda), 0);
}

/** Expected Vosfor a pack gives back if every copy is dissolved: below PACK_COST, so recycling converges. */
export const packYield = (ds: readonly Drop[]) => PULLS_PER_PACK * ds.reduce((a, d) => a + d.chance * d.yield, 0);

/**
 * Plat per Vosfor when you recycle into this collection: the λ with λ = packValue(λ) / PACK_COST. packValue is
 * convex and increasing with a slope (packYield / PACK_COST) below 1, so iterating from the sell-only value climbs
 * monotonically to the fixed point.
 */
export function vosforValue(ds: readonly Drop[]): number {
  let lambda = packValue(ds) / PACK_COST;
  for (let i = 0; i < 200; i++) {
    const next = packValue(ds, lambda) / PACK_COST;
    if (Math.abs(next - lambda) < 1e-9) return next;
    lambda = next;
  }
  return lambda;
}

/** Chance of at least one copy of an arcane with per-slot chance p in n packs. */
export const atLeastOne = (p: number, packs = 1) => 1 - (1 - p) ** (PULLS_PER_PACK * packs);

/** Packs needed for a `q` chance of at least one copy. */
export function packsFor(p: number, q: number): number {
  if (p <= 0) return Infinity;
  if (p >= 1) return 1;
  return Math.max(1, Math.ceil(Math.log(1 - q) / (PULLS_PER_PACK * Math.log(1 - p))));
}

export const packsFrom = (vosfor: number) => Math.floor(Math.max(0, vosfor) / PACK_COST);

export type Outcome = {
  /** Mean and percentiles of the plat earned. */
  mean: number;
  p10: number;
  p50: number;
  p90: number;
  /** Mean packs opened (more than packsFrom(vosfor) when recycling). */
  packs: number;
  /** Share of runs that pulled at least one Legendary. */
  legendary: number;
  runs: number;
};

/** mulberry32: tiny seeded PRNG, so the server render and the hydrated client agree. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pulls simulated per call, at most: keeps one simulation around a few tens of milliseconds. */
const PULL_BUDGET = 3_000_000;

/**
 * Monte Carlo of spending `vosfor` on one collection. With "recycle", copies worth more as Vosfor (at `lambda`) are
 * dissolved and the Vosfor buys more packs until less than one pack is left.
 */
export function simulate(ds: readonly Drop[], vosfor: number, strategy: Strategy, lambda: number, seed = 1): Outcome {
  const random = rng(seed);
  const cum: number[] = [];
  let total = 0;
  for (const d of ds) cum.push((total += d.chance));
  const lam = strategy === "recycle" ? lambda : 0;
  const dissolve = ds.map((d) => dissolves(d, lam));
  const plat = ds.map((d) => d.price ?? 0);
  const expectedPacks =
    packsFrom(vosfor) / Math.max(0.01, 1 - (strategy === "recycle" ? packYield(ds) : 0) / PACK_COST);
  const runs = Math.max(200, Math.min(2000, Math.floor(PULL_BUDGET / Math.max(1, expectedPacks * PULLS_PER_PACK))));

  const results = new Float64Array(runs);
  let packSum = 0;
  let legendaryRuns = 0;
  for (let r = 0; r < runs; r++) {
    let balance = vosfor;
    let earned = 0;
    let legendary = false;
    while (balance >= PACK_COST) {
      balance -= PACK_COST;
      packSum++;
      for (let s = 0; s < PULLS_PER_PACK; s++) {
        const x = random() * total;
        let i = 0;
        while (i < cum.length - 1 && x >= cum[i]!) i++;
        if (ds[i]!.rarity === "Legendary") legendary = true;
        if (dissolve[i]) balance += ds[i]!.yield;
        else earned += plat[i]!;
      }
    }
    results[r] = earned;
    if (legendary) legendaryRuns++;
  }
  results.sort();
  const q = (f: number) => results[Math.min(runs - 1, Math.floor(f * runs))]!;
  return {
    mean: results.reduce((a, b) => a + b, 0) / runs,
    p10: q(0.1),
    p50: q(0.5),
    p90: q(0.9),
    packs: packSum / runs,
    legendary: legendaryRuns / runs,
    runs,
  };
}

export type CollectionValue = {
  id: string;
  name: string;
  drops: Drop[];
  /** Expected plat per pack when selling everything. */
  sellPack: number;
  /** Plat per Vosfor when recycling, and the matching value of one pack (PACK_COST × λ). */
  lambda: number;
  recyclePack: number;
  /** Chance a pack holds at least one Legendary. */
  legendary: number;
  /** Arcanes with a recent rank-0 price, out of all. */
  priced: number;
};

export function valueCollections(
  collections: readonly Collection[],
  prices: ReadonlyMap<string, Price>,
): CollectionValue[] {
  return collections.map((c) => {
    const ds = drops(c, prices);
    const lambda = vosforValue(ds);
    const leg = ds.filter((d) => d.rarity === "Legendary").reduce((a, d) => a + d.chance, 0);
    return {
      id: c.id,
      name: c.name,
      drops: ds,
      sellPack: packValue(ds),
      lambda,
      recyclePack: lambda * PACK_COST,
      legendary: atLeastOne(leg),
      priced: ds.filter((d) => d.price != null).length,
    };
  });
}
