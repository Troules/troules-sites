import { describe, expect, it } from "vitest";
import { biggestDrop, isMaxRank, movers, ofKind, pulse, toRows, top, variantLabel } from "./rank";
import type { CatalogItem, Summary } from "./types";

const item = (slug: string, maxRank: number | null): CatalogItem => ({
  slug,
  name: slug.replace(/_/g, " "),
  thumb: null,
  kind: "Item",
  maxRank,
  subtypes: null,
});
const sum = (slug: string, rank: number | null, o: Partial<Summary> = {}): Summary => ({
  slug,
  rank,
  subtype: null,
  price7: 10,
  vol7: 10,
  plat7: 100,
  trend7: 0,
  last_day: "2026-11-02",
  spark30: [],
  ...o,
});
const catalog = new Map([item("arcane", 5), item("set", null), item("mod", 10)].map((c) => [c.slug, c]));

describe("toRows", () => {
  it("keeps only max-rank rows and unranked items", () => {
    const rows = toRows(
      [sum("arcane", 0), sum("arcane", 5), sum("set", null), sum("mod", 0), sum("ghost", null)],
      catalog,
    );
    expect(rows.map((r) => `${r.slug}:${r.rank}`)).toEqual(["arcane:5", "set:null"]);
    expect(rows[0]!.name).toBe("arcane");
  });

  it("isMaxRank treats unranked catalog items as max", () => {
    expect(isMaxRank({ rank: null }, { maxRank: null })).toBe(true);
    expect(isMaxRank({ rank: 3 }, { maxRank: 5 })).toBe(false);
  });
});

describe("top", () => {
  const rows = toRows(
    [
      sum("arcane", 5, { plat7: 300, price7: 120, vol7: 2.5, trend7: 40 }),
      sum("set", null, { plat7: 500, price7: 50, vol7: 10, trend7: -12 }),
      sum("mod", 10, { plat7: 100, price7: 90, vol7: 1, trend7: 5 }),
    ],
    catalog,
  );

  it("sorts by the chosen metric, highest first", () => {
    expect(top(rows, "plat").map((r) => r.slug)).toEqual(["set", "arcane", "mod"]);
    expect(top(rows, "price").map((r) => r.slug)).toEqual(["arcane", "mod", "set"]);
    expect(top(rows, "plat", 1)).toHaveLength(1);
  });

  it("leaves thin markets out of the trend list and the drop tile", () => {
    expect(top(rows, "trend").map((r) => r.slug)).toEqual(["set"]);
    expect(biggestDrop(rows)?.slug).toBe("set");
  });
});

describe("kinds, movers and pulse", () => {
  const typed = new Map(
    [
      { ...item("arcane", 5), kind: "Arcane" },
      { ...item("part", null), kind: "Part" },
      { ...item("blueprint", null), kind: "Blueprint" },
      { ...item("thin", null), kind: "Mod" },
    ].map((c) => [c.slug, c]),
  );
  const rows = toRows(
    [
      sum("arcane", 5, { plat7: 900, trend7: 12 }),
      sum("part", null, { plat7: 50, trend7: -30 }),
      sum("blueprint", null, { plat7: 80, trend7: 0.4 }),
      sum("thin", null, { plat7: 5, vol7: 0.5, trend7: 300 }),
    ],
    typed,
  );

  it("narrows a list to one item type", () => {
    expect(ofKind(rows, "all")).toHaveLength(4);
    expect(ofKind(rows, "parts").map((r) => r.slug)).toEqual(["part", "blueprint"]);
    expect(top(rows, "plat", 10, "parts").map((r) => r.slug)).toEqual(["blueprint", "part"]);
    expect(top(rows, "plat", 10, "relics")).toEqual([]);
  });

  it("lists the week's rises and drops among liquid items only", () => {
    const m = movers(rows, 5);
    expect(m.up.map((r) => r.slug)).toEqual(["arcane", "blueprint"]);
    expect(m.down.map((r) => r.slug)).toEqual(["part"]);
  });

  it("sums the market and counts real moves", () => {
    expect(pulse(rows)).toEqual({ plat: 1035, trades: 30.5, rising: 1, falling: 1, flat: 1 });
  });
});

describe("variantLabel", () => {
  it("names rank and subtype", () => {
    expect(variantLabel({ rank: 5, subtype: null }, 5)).toBe("Rank 5 (max)");
    expect(variantLabel({ rank: 0, subtype: null }, 5)).toBe("Rank 0");
    expect(variantLabel({ rank: null, subtype: "radiant" }, null)).toBe("Radiant");
    expect(variantLabel({ rank: null, subtype: null }, null)).toBe("Unranked");
  });
});
