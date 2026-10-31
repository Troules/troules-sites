import { describe, expect, it } from "vitest";
import { PAGE_SIZE, pageCount, pageHref, paginate, parsePage } from "./pagination";

const posts = Array.from({ length: 23 }, (_, i) => i);

describe("pagination", () => {
  it("uses 10 articles per page", () => expect(PAGE_SIZE).toBe(10));

  it("counts pages, with at least one", () => {
    expect([0, 1, 10, 11, 23].map(pageCount)).toEqual([1, 1, 1, 2, 3]);
  });

  it("slices each page and rejects pages out of range", () => {
    expect(paginate(posts, 1)).toEqual({ items: posts.slice(0, 10), page: 1, pages: 3 });
    expect(paginate(posts, 3)?.items).toEqual([20, 21, 22]);
    for (const page of [0, -1, 4, 1.5]) expect(paginate(posts, page)).toBeNull();
    expect(paginate([], 1)).toEqual({ items: [], page: 1, pages: 1 });
  });

  it("parses only canonical page numbers", () => {
    expect(parsePage("2")).toBe(2);
    for (const s of ["0", "02", "2.0", "-1", "two", "", "1e3"]) expect(parsePage(s)).toBeNull();
  });

  it("links page 1 to the home page", () => {
    expect(pageHref(1)).toBe("/");
    expect(pageHref(3)).toBe("/page/3");
  });
});
