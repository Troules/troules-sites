import type { CatalogItem, Row, SetParts } from "./types";

/**
 * Set or parts? On warframe.market a "set" is just every part sold in one trade, so a player holding the parts can
 * list them either way, and a trader can buy parts one by one and resell the bundle. Both come down to the same gap:
 * the set's median minus the sum of its parts' medians. Pure functions over 7-day medians.
 */
export type SetPart = Pick<CatalogItem, "slug" | "name" | "thumb"> & {
  /** Copies of this part in one set (Dual Kamas Prime takes two blades). */
  qty: number;
  /** 7-day median for one copy; null without recent trades. */
  price: number | null;
  vol: number;
};

export type SetRow = Pick<CatalogItem, "slug" | "name" | "thumb"> & {
  /** 7-day median of the set; null without recent trades. */
  price: number | null;
  vol: number;
  parts: SetPart[];
  /** Σ qty × part median; null when a part has no price. */
  partsTotal: number | null;
  /** Set median minus partsTotal: positive means the bundle sells for more than its parts. */
  gap: number | null;
  /** True when the set and every part trade at least MIN_SET_VOLUME times a day. */
  liquid: boolean;
};

/** Thin markets give medians nobody can actually trade at. */
export const MIN_SET_VOLUME = 1;
/** A gap under this (plat, and share of the set price) is inside the noise of two medians. */
export const MIN_GAP = { plat: 3, share: 0.05 };

export function setRows(sets: SetParts, rows: Row[], catalog: ReadonlyMap<string, CatalogItem>): SetRow[] {
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return Object.entries(sets).flatMap(([slug, members]) => {
    const item = catalog.get(slug);
    if (!item) return [];
    const parts = members.flatMap(([partSlug, qty]) => {
      const part = catalog.get(partSlug);
      const row = bySlug.get(partSlug);
      return part
        ? [{ slug: partSlug, name: part.name, thumb: part.thumb, qty, price: row?.price7 ?? null, vol: row?.vol7 ?? 0 }]
        : [];
    });
    if (!parts.length) return [];
    const row = bySlug.get(slug);
    const price = row?.price7 ?? null;
    const partsTotal = parts.every((p) => p.price != null) ? parts.reduce((a, p) => a + p.qty * p.price!, 0) : null;
    const vol = row?.vol7 ?? 0;
    return [
      {
        slug,
        name: item.name,
        thumb: item.thumb,
        price,
        vol,
        parts,
        partsTotal,
        gap: price != null && partsTotal != null ? price - partsTotal : null,
        liquid: vol >= MIN_SET_VOLUME && parts.every((p) => p.vol >= MIN_SET_VOLUME),
      },
    ];
  });
}

export type SetAdvice = "set" | "parts" | "same" | "unknown";

/** Which way of selling pays more, once the gap is big enough to trust. */
export function setAdvice(r: Pick<SetRow, "gap" | "price">): SetAdvice {
  if (r.gap == null || r.price == null) return "unknown";
  if (Math.abs(r.gap) < Math.max(MIN_GAP.plat, r.price * MIN_GAP.share)) return "same";
  return r.gap > 0 ? "set" : "parts";
}

/** Liquid sets with a known gap, biggest difference first (either direction). */
export function rankedSets(rows: SetRow[]): SetRow[] {
  return rows
    .filter((r) => r.gap != null && r.liquid)
    .sort((a, b) => Math.abs(b.gap!) - Math.abs(a.gap!) || a.name.localeCompare(b.name));
}

/** Part slug → set slug, to show a part's siblings on its own page. */
export function setOfPart(sets: SetParts): Map<string, string> {
  const m = new Map<string, string>();
  for (const [slug, members] of Object.entries(sets)) for (const [part] of members) m.set(part, slug);
  return m;
}
