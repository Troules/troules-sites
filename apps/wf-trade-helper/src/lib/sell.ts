import type { Book, Order } from "./types";

export type Suggestion = {
  price: number;
  basis: "undercut" | "buyer" | "median";
  lowestSeller: number | null;
  highestBuyer: number | null;
};

const ACTIVE = new Set(["ingame", "online"]);

export function matching(orders: Order[], rank: number | null, subtype: string | null): Order[] {
  return orders.filter((o) => ACTIVE.has(o.status) && o.rank === rank && o.subtype === subtype);
}

/**
 * A sell price for one (rank, subtype):
 * - 1p under the cheapest online seller, so the listing shows first;
 * - unless a buyer already pays that much: then sell to the buyer now;
 * - with no online seller, the 7-day median.
 */
export function suggestPrice(book: Book, rank: number | null, subtype: string | null, price7: number): Suggestion {
  const sellers = matching(book.sell, rank, subtype).map((o) => o.platinum);
  const buyers = matching(book.buy, rank, subtype).map((o) => o.platinum);
  const lowestSeller = sellers.length ? Math.min(...sellers) : null;
  const highestBuyer = buyers.length ? Math.max(...buyers) : null;
  if (lowestSeller == null)
    return { price: Math.max(1, Math.round(price7)), basis: "median", lowestSeller, highestBuyer };
  const undercut = Math.max(1, lowestSeller - 1);
  if (highestBuyer != null && highestBuyer >= undercut)
    return { price: highestBuyer, basis: "buyer", lowestSeller, highestBuyer };
  return { price: undercut, basis: "undercut", lowestSeller, highestBuyer };
}
