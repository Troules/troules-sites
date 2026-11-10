import type { Row } from "./types";

/**
 * Ducats for Baro Ki'Teer. Prime parts convert to ducats at a fixed rate (15, 25, 45, 65 or 100 a part), whatever
 * they sell for, so two questions have a market answer: which parts are the cheapest ducats to buy, and which of
 * your own parts are worth too much plat to feed the kiosk. Pure functions; prices are 7-day medians.
 */
export type DucatRow = Pick<Row, "slug" | "name" | "thumb" | "kind"> & {
  ducats: number;
  /** 7-day median, in plat. */
  price: number;
  /** Completed trades per day. */
  vol: number;
  /** Ducats bought per plat spent: higher is a cheaper way to fill up before Baro lands. */
  perPlat: number;
  /** Plat given up per 100 ducats when the part goes into the kiosk instead of the market. */
  platPer100: number;
};

/** A price nobody pays once a day is an asking price: you can't count on buying or selling there. */
export const MIN_DUCAT_VOLUME = 1;

export function ducatRows(rows: Row[], ducatsOf: (slug: string) => number | null | undefined): DucatRow[] {
  return rows.flatMap((r) => {
    const ducats = ducatsOf(r.slug);
    if (!ducats || r.price7 <= 0 || r.vol7 < MIN_DUCAT_VOLUME) return [];
    return [
      {
        slug: r.slug,
        name: r.name,
        thumb: r.thumb,
        kind: r.kind,
        ducats,
        price: r.price7,
        vol: r.vol7,
        perPlat: ducats / r.price7,
        platPer100: (r.price7 / ducats) * 100,
      },
    ];
  });
}

/** Cheapest ducats first; the busier market wins a tie because you can actually fill an order there. */
export const cheapestDucats = (rows: DucatRow[]): DucatRow[] =>
  [...rows].sort((a, b) => b.perPlat - a.perPlat || b.vol - a.vol || a.name.localeCompare(b.name));

/** Parts whose plat price is high for the ducats they give: sell these, don't trade them in. */
export const worthSelling = (rows: DucatRow[]): DucatRow[] =>
  [...rows].sort((a, b) => b.platPer100 - a.platPer100 || b.vol - a.vol || a.name.localeCompare(b.name));

export type PlanLine = { row: DucatRow; copies: number };
export type Plan = { lines: PlanLine[]; ducats: number; plat: number; reached: boolean };

/**
 * A shopping list for `target` ducats: cheapest ducats first, buying at most one day's trades of each part, since
 * that is roughly what the market hands over at the median without bidding the price up.
 */
export function ducatPlan(rows: DucatRow[], target: number): Plan {
  const plan: Plan = { lines: [], ducats: 0, plat: 0, reached: target <= 0 };
  if (!(target > 0)) return plan;
  for (const row of cheapestDucats(rows)) {
    const available = Math.max(1, Math.floor(row.vol));
    const copies = Math.min(available, Math.ceil((target - plan.ducats) / row.ducats));
    plan.lines.push({ row, copies });
    plan.ducats += copies * row.ducats;
    plan.plat += copies * row.price;
    if (plan.ducats >= target) {
      plan.reached = true;
      break;
    }
  }
  return plan;
}
