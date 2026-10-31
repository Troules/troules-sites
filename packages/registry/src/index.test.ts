import { describe, expect, it } from "vitest";
import { ROOT_DOMAIN, liveSites, sites } from "./index";

describe("site registry", () => {
  it("has unique slugs", () => {
    const slugs = sites.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(sites)("$slug has an https URL on the root domain and a short description", (site) => {
    const url = new URL(site.url);
    expect(url.protocol).toBe("https:");
    expect(url.hostname === ROOT_DOMAIN || url.hostname.endsWith(`.${ROOT_DOMAIN}`)).toBe(true);
    expect(site.description.length).toBeGreaterThan(10);
    expect(site.description.length).toBeLessThanOrEqual(140);
  });

  it("filters live sites", () => {
    expect(liveSites([{ ...sites[0]!, status: "soon" }])).toEqual([]);
  });
});
