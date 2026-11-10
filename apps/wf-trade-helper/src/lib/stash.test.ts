import { describe, expect, it } from "vitest";
import {
  addEntry,
  byPriority,
  call,
  chatMessages,
  entryKey,
  MAX_QTY,
  parseStash,
  removeEntry,
  setQty,
  setVariant,
  stashLines,
  type PriceIndex,
  type StashEntry,
} from "./stash";

const e = (slug: string, rank: number | null = null, qty = 1): StashEntry => ({ slug, rank, subtype: null, qty });

describe("parseStash", () => {
  it("survives anything localStorage can hold", () => {
    expect(parseStash(null)).toEqual([]);
    expect(parseStash("{not json")).toEqual([]);
    expect(parseStash('{"slug":"a"}')).toEqual([]);
    expect(
      parseStash(
        JSON.stringify([
          { slug: "arcane_energize", rank: 5, subtype: null, qty: 3 },
          { slug: "arcane_energize", rank: 5, subtype: null, qty: 9 },
          { slug: "../etc", qty: 1 },
          { slug: "wisp_prime_set", rank: "x", qty: -4 },
          null,
        ]),
      ),
    ).toEqual([e("arcane_energize", 5, 3), e("wisp_prime_set", null, 1)]);
  });
});

describe("editing", () => {
  it("adds, merges, edits and removes entries without mutating", () => {
    const one = addEntry([], e("a", 5));
    const two = addEntry(one, e("a", 5), 2);
    expect(two).toEqual([e("a", 5, 3)]);
    expect(one).toEqual([e("a", 5, 1)]);
    expect(setQty(two, "a|5|null", 0)[0]!.qty).toBe(1);
    expect(setQty(two, "a|5|null", 1e9)[0]!.qty).toBe(MAX_QTY);
    expect(removeEntry(two, entryKey(e("a", 5)))).toEqual([]);
  });

  it("switches rank, merging into a line that already holds it", () => {
    const list = [e("a", 5, 2), e("a", 0, 4), e("b")];
    expect(setVariant(list, "a|5|null", 3, null)).toEqual([e("a", 3, 2), e("a", 0, 4), e("b")]);
    expect(setVariant(list, "a|5|null", 0, null)).toEqual([e("a", 0, 6), e("b")]);
  });
});

describe("call", () => {
  it("reads the same signals as the lists", () => {
    expect(call(null).call).toBe("none");
    expect(call([5, null, 100, 0.4, 2, 0.9]).call).toBe("thin");
    expect(call([5, null, 100, 20, 2, 0.85])).toEqual({ call: "sell", why: "Higher than on 85% of the last 90 days." });
    expect(call([5, null, 100, 20, 2, 0.1]).call).toBe("hold");
    expect(call([5, null, 100, 20, -18, 0.5]).call).toBe("falling");
    expect(call([5, null, 100, 20, null, null]).call).toBe("fair");
  });
});

describe("stashLines", () => {
  const index: PriceIndex = {
    a: [
      [5, null, 120, 30, 1, 0.5],
      [0, null, 7, 90, 0, 0.5],
    ],
    b: [[null, null, 60, 100, 3, 0.95]],
  };

  it("values each line at its own rank and puts what to sell first", () => {
    const lines = stashLines([e("a", 5, 2), e("a", 0, 21), e("b", null, 1), e("ghost")], index);
    expect(lines.map((l) => l.value)).toEqual([240, 147, 60, 0]);
    expect(byPriority(lines).map((l) => l.key)).toEqual(["b|null|null", "a|5|null", "a|0|null", "ghost|null|null"]);
  });
});

describe("chatMessages", () => {
  const items = [
    { name: "Arcane Energize", rank: 5, subtype: null, price: 120.6 },
    { name: "Axi A1 Relic", rank: null, subtype: "radiant", price: 0.2 },
    { name: "Wisp Prime Set", rank: null, subtype: null, price: null },
  ];

  it("links items the way trade chat does", () => {
    expect(chatMessages("WTS", items)).toEqual([
      "WTS [Arcane Energize] R5 121p [Axi A1 Relic] radiant 1p [Wisp Prime Set]",
    ]);
    expect(chatMessages("WTB", [])).toEqual([]);
  });

  it("splits long lists into messages that each start with the tag", () => {
    const out = chatMessages("WTS", items, 40);
    expect(out).toEqual(["WTS [Arcane Energize] R5 121p", "WTS [Axi A1 Relic] radiant 1p", "WTS [Wisp Prime Set]"]);
  });
});
