import { describe, expect, it } from "vitest";
import { suggestPrice } from "./sell";
import type { Order } from "./types";

const o = (platinum: number, rank: number | null = 5, status = "ingame", subtype: string | null = null): Order => ({
  platinum,
  quantity: 1,
  rank,
  subtype,
  reputation: 0,
  status,
});

describe("suggestPrice", () => {
  it("undercuts the cheapest online seller of the same rank by 1p", () => {
    const book = { sell: [o(8, 0), o(125), o(122), o(100, 5, "offline")], buy: [o(90)] };
    expect(suggestPrice(book, 5, null, 121)).toEqual({
      price: 121,
      basis: "undercut",
      lowestSeller: 122,
      highestBuyer: 90,
    });
  });

  it("sells to a buyer who already pays the undercut price", () => {
    const book = { sell: [o(50)], buy: [o(52), o(40)] };
    expect(suggestPrice(book, 5, null, 45)).toMatchObject({ price: 52, basis: "buyer" });
  });

  it("falls back to the 7-day median without online sellers", () => {
    expect(suggestPrice({ sell: [], buy: [] }, 5, null, 64.6)).toMatchObject({ price: 65, basis: "median" });
  });

  it("matches subtypes and never suggests below 1p", () => {
    const book = { sell: [o(1, null, "online", "intact"), o(9, null, "online", "radiant")], buy: [] };
    expect(suggestPrice(book, null, "intact", 3).price).toBe(1);
    expect(suggestPrice(book, null, "radiant", 3).price).toBe(8);
  });
});
