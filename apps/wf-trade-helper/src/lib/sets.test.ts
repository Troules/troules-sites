import { describe, expect, it } from "vitest";
import catalogJson from "@/fixtures/catalog.json";
import setsJson from "@/fixtures/sets.json";
import { rankedSets, setAdvice, setOfPart, setRows } from "./sets";
import type { CatalogItem, Row, SetParts } from "./types";

const item = (slug: string): CatalogItem => ({
  slug,
  name: slug,
  thumb: null,
  kind: "Part",
  maxRank: null,
  subtypes: null,
});
const catalog = new Map(
  ["kamas_set", "blade", "handle", "wisp_set", "wisp_bp", "odd_set", "odd_bp"].map((s) => [s, item(s)]),
);
const row = (slug: string, price7: number, vol7 = 5): Row => ({ slug, price7, vol7 }) as Row;
const SETS: SetParts = {
  kamas_set: [
    ["blade", 2],
    ["handle", 1],
  ],
  wisp_set: [["wisp_bp", 1]],
  odd_set: [
    ["odd_bp", 1],
    ["not_in_catalog", 1],
  ],
};

describe("setRows", () => {
  const rows = setRows(
    SETS,
    [row("kamas_set", 90), row("blade", 35), row("handle", 8), row("wisp_set", 60), row("wisp_bp", 61, 0.2)],
    catalog,
  );
  const by = (slug: string) => rows.find((r) => r.slug === slug)!;

  it("multiplies each part by its quantity in the set", () => {
    expect(by("kamas_set")).toMatchObject({ price: 90, partsTotal: 78, gap: 12, liquid: true });
  });

  it("flags thin parts and leaves unpriced sets without a gap", () => {
    expect(by("wisp_set")).toMatchObject({ gap: -1, liquid: false });
    expect(by("odd_set")).toMatchObject({ price: null, partsTotal: null, gap: null });
    expect(by("odd_set").parts.map((p) => p.slug)).toEqual(["odd_bp"]);
  });

  it("ranks liquid sets by the size of the gap and advises only past the noise", () => {
    expect(rankedSets(rows).map((r) => r.slug)).toEqual(["kamas_set"]);
    expect(setAdvice(by("kamas_set"))).toBe("set");
    expect(setAdvice({ price: 90, gap: -12 })).toBe("parts");
    expect(setAdvice({ price: 90, gap: 4 })).toBe("same");
    expect(setAdvice({ price: 20, gap: 2 })).toBe("same");
    expect(setAdvice(by("odd_set"))).toBe("unknown");
  });

  it("finds a part's set", () => {
    expect(setOfPart(SETS).get("blade")).toBe("kamas_set");
  });
});

describe("committed set compositions", () => {
  const slugs = new Set((catalogJson as CatalogItem[]).map((c) => c.slug));

  it("only name catalog items, each with a positive whole quantity", () => {
    const sets = setsJson as unknown as SetParts;
    expect(Object.keys(sets).length).toBeGreaterThan(200);
    for (const [slug, parts] of Object.entries(sets)) {
      expect(slugs.has(slug), slug).toBe(true);
      for (const [part, qty] of parts) {
        expect(slugs.has(part), part).toBe(true);
        expect(Number.isInteger(qty) && qty > 0, `${part} × ${qty}`).toBe(true);
      }
    }
  });
});
