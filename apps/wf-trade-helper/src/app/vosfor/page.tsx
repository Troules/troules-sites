import type { Metadata } from "next";
import Link from "next/link";
import { VosforCalculator } from "@/components/vosfor-calculator";
import { getMeta, getVosforPrices } from "@/lib/market";
import { PACK_COST, PACK_CREDITS, PULLS_PER_PACK } from "@/lib/vosfor-data";

export const metadata: Metadata = {
  title: "Vosfor calculator",
  description:
    "Which of Loid's Arcane Collections pays the most plat for your Vosfor: drop chances, expected plat per pack and when to dissolve instead of selling.",
  alternates: { canonical: "/vosfor" },
};

export default async function VosforPage() {
  const [prices, meta] = await Promise.all([getVosforPrices(), getMeta()]);
  const priced = prices.filter((p) => p.price != null).length;

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 pt-6 pb-6 sm:px-5">
      <nav aria-label="Breadcrumb" className="text-muted text-xs">
        <Link href="/" className="link">
          Market
        </Link>{" "}
        / Vosfor calculator
      </nav>
      <div>
        <h1 className="text-[32px] leading-tight font-semibold">Vosfor calculator</h1>
        <p className="text-muted mt-1.5 max-w-[72ch] leading-relaxed">
          Loid sells nine Arcane Collections for {PACK_COST} Vosfor and {PACK_CREDITS.toLocaleString("en-US")} credits
          each. A pack gives {PULLS_PER_PACK} unranked arcanes, each drawn on its own. This page values every pull at
          its rank-0 7-day median on warframe.market and shows which collection pays the most plat for the Vosfor you
          have.
        </p>
        {priced < prices.length && (
          <p className="border-line-strong text-muted mt-3 max-w-[760px] rounded-lg border border-dashed px-3 py-2 text-xs">
            {meta.sample ? "Sample data: " : ""}
            {priced} of {prices.length} arcanes have recent rank-0 trades. The others count as 0p when sold, so
            collections with few priced arcanes look worse than they are.
          </p>
        )}
      </div>

      <VosforCalculator prices={prices} />

      <section aria-labelledby="method" className="text-muted max-w-[760px] text-xs leading-relaxed">
        <h2 id="method" className="text-ink text-[13px] font-semibold">
          How it is computed
        </h2>
        <ul className="mt-1.5 list-disc space-y-1 pl-[18px]">
          <li>
            <strong className="text-ink font-medium">Sell everything:</strong> expected plat per pack = {PULLS_PER_PACK}{" "}
            × Σ (chance × rank-0 median).
          </li>
          <li>
            <strong className="text-ink font-medium">Sell or dissolve:</strong> if a pack is worth V plat, one Vosfor is
            worth V / {PACK_COST}. A copy that sells for less than its Vosfor yield × that value is dissolved and buys
            more packs. Because V depends on what you dissolve, the value is solved as a fixed point. Leftover Vosfor
            below {PACK_COST} is worth nothing in the simulation.
          </li>
          <li>
            The range is 10th to 90th percentile over up to 2,000 simulated runs. Medians move, selling takes time, and
            thin markets (under 1 trade a day) may not absorb many copies at that price.
          </li>
          <li>
            Drop chances and Vosfor yields come from the Warframe wiki (pages Vosfor and Arcane Enhancement, read
            2026-11-09). The wiki contradicts itself on Ostron&apos;s pools; this page uses 10 / 30 / 60% for Common /
            Uncommon / Rare.
          </li>
        </ul>
      </section>
    </main>
  );
}
