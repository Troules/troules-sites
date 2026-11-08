import { describe, expect, it } from "vitest";
import type { Bucket } from "@/lib/signals";
import { verdict } from "./timing";

const hours = (at: Record<number, number>, trades = 30): Bucket[] =>
  Array.from({ length: 24 }, (_, h) => (h in at ? { pct: at[h]!, trades } : { pct: null, trades: 0 }));

describe("verdict", () => {
  it("names the region that pays more than Europe", () => {
    expect(verdict(hours({ 2: 3, 18: 1 }))).toBe(
      "Sell during the Americas evening: about 2.0% above the Europe evening.",
    );
    expect(verdict(hours({ 10: -1, 18: 1 }))).toBe(
      "The Europe evening pays best: 2.0% above the Asia & Oceania evening.",
    );
    expect(verdict(hours({ 2: 1.2, 18: 1 }))).toMatch(/^No real difference/);
  });

  it("refuses to pick a winner on thin data", () => {
    expect(verdict(hours({ 2: 9, 18: 1 }, 5))).toMatch(/^Not enough/);
  });
});
