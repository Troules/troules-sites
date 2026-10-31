import { describe, expect, it } from "vitest";
import { frontmatterSchema } from "./schema";
import { byNewest, day, formatDate } from "./site";

describe("post ordering", () => {
  it("puts the newest first and uses the optional time to order same-day posts", () => {
    const posts = [
      { slug: "a-older-day", date: "2026-10-30" },
      { slug: "b-same-day-early", date: "2026-10-31T09:00" },
      { slug: "c-same-day-late", date: "2026-10-31T22:05" },
      { slug: "d-next-day", date: "2026-11-01" },
    ];
    expect(posts.sort(byNewest).map((p) => p.slug)).toEqual([
      "d-next-day",
      "c-same-day-late",
      "b-same-day-early",
      "a-older-day",
    ]);
  });

  it("shows only the day", () => {
    expect(day("2026-10-31T22:05")).toBe("2026-10-31");
    expect(formatDate("2026-10-31T22:05")).toBe("31 October 2026");
  });
});

describe("front matter date", () => {
  const base = { title: "A title", description: "A description long enough.", kind: "note", tags: ["meta"] };
  it.each(["2026-10-31", "2026-10-31T22:05"])("accepts %s", (date) =>
    expect(frontmatterSchema.safeParse({ ...base, date }).success).toBe(true),
  );
  it.each(["2026-10-31 22:05", "2026-10-31T25:00", "2026-10-31T22:05:00", "2026-13-01"])("rejects %s", (date) =>
    expect(frontmatterSchema.safeParse({ ...base, date }).success).toBe(false),
  );
  it("still accepts an update on the publication day", () =>
    expect(frontmatterSchema.safeParse({ ...base, date: "2026-10-31T22:05", updated: "2026-10-31" }).success).toBe(
      true,
    ));
});
