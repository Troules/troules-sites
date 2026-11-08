import { describe, expect, it } from "vitest";
import { search, type IndexEntry } from "./search";

const index: IndexEntry[] = [
  ["wisp_prime_blueprint", "Wisp Prime Blueprint", null, "Blueprint"],
  ["wisp_prime_set", "Wisp Prime Set", null, "Set"],
  ["arcane_energize", "Arcane Energize", null, "Arcane"],
  ["primed_chamber", "Primed Chamber", null, "Mod"],
  ["galvanized_chamber", "Galvanized Chamber", null, "Mod"],
];
const names = (q: string) => search(index, q).map((h) => h.entry[1]);

describe("search", () => {
  it("ranks name prefix, then word prefix, shorter names first", () => {
    expect(names("wisp")).toEqual(["Wisp Prime Set", "Wisp Prime Blueprint"]);
    expect(names("chamber")).toEqual(["Primed Chamber", "Galvanized Chamber"]);
  });

  it("needs every word, in any order, and ignores case and spacing", () => {
    expect(names("  SET   wisp ")).toEqual(["Wisp Prime Set"]);
    expect(names("wisp chamber")).toEqual([]);
    expect(names("")).toEqual([]);
  });

  it("returns the matched span for highlighting", () => {
    const [hit] = search(index, "energ");
    expect(hit!.entry[1].slice(hit!.at, hit!.at + hit!.len)).toBe("Energ");
  });
});
