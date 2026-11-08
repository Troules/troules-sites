import { describe, expect, it } from "vitest";
import { lastDays, variants } from "./variants";
import type { DailyRow, Summary } from "./types";

const h = (day: string, rank: number | null, subtype: string | null = null): DailyRow => [
  day,
  rank,
  subtype,
  1,
  1,
  2,
  1,
];

describe("variants", () => {
  it("puts the max rank first and sorts each history by day", () => {
    const vs = variants(
      { maxRank: 5 },
      [{ rank: 5, subtype: null } as Summary],
      [h("2026-11-02", 0), h("2026-11-02", 5), h("2026-11-01", 5), h("2026-11-01", 3)],
    );
    expect(vs.map((v) => v.rank)).toEqual([5, 3, 0]);
    expect(vs[0]!.days.map((d) => d.day)).toEqual(["2026-11-01", "2026-11-02"]);
    expect(vs[0]!.summary).not.toBeNull();
    expect(vs[1]!.summary).toBeNull();
  });

  it("keeps subtypes apart", () => {
    const vs = variants({ maxRank: null }, [], [h("2026-11-01", null, "radiant"), h("2026-11-01", null, "intact")]);
    expect(vs.map((v) => v.subtype)).toEqual(["intact", "radiant"]);
  });
});

describe("lastDays", () => {
  it("keeps the n calendar days ending at asOf", () => {
    const days = ["2026-10-26", "2026-10-27", "2026-11-02", "2026-11-03"].map((day) => ({
      day,
      volume: 1,
      min: 1,
      max: 1,
      median: 1,
    }));
    expect(lastDays(days, "2026-11-02", 7).map((d) => d.day)).toEqual(["2026-10-27", "2026-11-02"]);
  });
});
