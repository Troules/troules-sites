import { describe, expect, it } from "vitest";
import { timeline } from "./timeline";

describe("timeline", () => {
  it("runs from the oldest moment to the most recent", () => {
    const years = timeline.map((m) => m.year);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it("has unique slugs (they are the anchors of the rail)", () => {
    expect(new Set(timeline.map((m) => m.slug)).size).toBe(timeline.length);
  });

  it("describes every image", () => {
    for (const m of timeline) {
      expect(m.alt.length, m.slug).toBeGreaterThan(20);
      expect(m.description.length, m.slug).toBeGreaterThan(60);
    }
  });
});
