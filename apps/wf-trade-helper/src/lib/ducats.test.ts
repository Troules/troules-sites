import { describe, expect, it } from "vitest";
import { cheapestDucats, ducatPlan, ducatRows, worthSelling } from "./ducats";
import type { Row } from "./types";

const row = (slug: string, price7: number, vol7: number): Row =>
  ({ slug, name: slug, thumb: null, kind: "Part", price7, vol7 }) as Row;
const DUCATS: Record<string, number> = { junk: 100, mid: 45, gem: 15, thin: 100 };
const rows = ducatRows(
  [row("junk", 10, 4.9), row("mid", 9, 20), row("gem", 30, 50), row("thin", 2, 0.4), row("mod", 5, 90)],
  (slug) => DUCATS[slug],
);

describe("ducatRows", () => {
  it("keeps priced prime parts that trade daily", () => {
    expect(rows.map((r) => r.slug)).toEqual(["junk", "mid", "gem"]);
    expect(rows[0]).toMatchObject({ ducats: 100, perPlat: 10, platPer100: 10 });
  });

  it("ranks cheapest ducats and parts too valuable to trade in", () => {
    expect(cheapestDucats(rows).map((r) => r.slug)).toEqual(["junk", "mid", "gem"]);
    expect(worthSelling(rows).map((r) => r.slug)).toEqual(["gem", "mid", "junk"]);
  });
});

describe("ducatPlan", () => {
  it("buys the cheapest ducats first, one day's trades of each at most", () => {
    const plan = ducatPlan(rows, 500);
    // 4 junk (floor of 4.9 trades a day) = 400 ducats, then 3 mid = 135.
    expect(plan.lines.map((l) => [l.row.slug, l.copies])).toEqual([
      ["junk", 4],
      ["mid", 3],
    ]);
    expect(plan).toMatchObject({ ducats: 535, plat: 67, reached: true });
  });

  it("says when the market cannot cover the target", () => {
    const plan = ducatPlan(rows, 100_000);
    expect(plan.reached).toBe(false);
    expect(plan.lines).toHaveLength(3);
    expect(ducatPlan(rows, 0)).toMatchObject({ lines: [], reached: true });
  });
});
