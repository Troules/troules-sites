import type { Metadata } from "next";
import Link from "next/link";
import { ItemIcon } from "@/components/item-icon";
import { compact, plat } from "@/lib/format";
import { getMeta, getSets } from "@/lib/market";
import { MIN_GAP, rankedSets, setAdvice, type SetAdvice, type SetRow } from "@/lib/sets";

export const metadata: Metadata = {
  title: "Set or parts",
  description:
    "Every Warframe prime set against the sum of its parts on warframe.market: which sets sell for more whole, and which pay more part by part.",
  alternates: { canonical: "/sets" },
};

const LIMIT = 100;

const ADVICE: Record<SetAdvice, { label: string; tone: string }> = {
  set: { label: "Sell as a set", tone: "border-up/60 text-up bg-up/10" },
  parts: { label: "Sell the parts", tone: "border-down/60 text-down bg-down/10" },
  same: { label: "Same either way", tone: "border-line-strong text-muted" },
  unknown: { label: "Not enough trades", tone: "border-line-strong text-muted" },
};

export default async function SetsPage() {
  const [sets, meta] = await Promise.all([getSets(), getMeta()]);
  const ranked = rankedSets(sets);
  const shown = ranked.slice(0, LIMIT);
  const whole = ranked.filter((r) => setAdvice(r) === "set").length;
  const split = ranked.filter((r) => setAdvice(r) === "parts").length;

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 pt-6 pb-6 sm:px-5">
      <nav aria-label="Breadcrumb" className="text-muted text-xs">
        <Link href="/" className="link">
          Market
        </Link>{" "}
        / Set or parts
      </nav>
      <div>
        <h1 className="text-[32px] leading-tight font-semibold">Set or parts?</h1>
        <p className="text-muted mt-1.5 max-w-[72ch] leading-relaxed">
          A set on warframe.market is every part sold in one trade. If you hold the parts you can list them either way,
          and if the set sells for more than its parts you can buy the parts one by one and resell the bundle. This page
          compares the two prices for every set.
        </p>
        <p className="mt-3 text-[13px]">
          <span className="num text-up">{whole}</span> {whole === 1 ? "set pays" : "sets pay"} more whole,{" "}
          <span className="num text-down">{split}</span> {split === 1 ? "pays" : "pay"} more in parts, out of{" "}
          <span className="num">{ranked.length}</span> where the set and every part trade daily.
        </p>
        {meta.sample && (
          <p className="border-line-strong text-muted mt-3 max-w-[72ch] rounded-lg border border-dashed px-3 py-2 text-xs">
            Sample data: only a few sets have prices for all their parts. The live site compares all {sets.length}.
          </p>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="text-muted py-10 text-center">No set traded daily together with all of its parts this week.</p>
      ) : (
        <section aria-labelledby="set-list" className="panel min-w-0">
          <h2 id="set-list" className="px-[18px] pt-4 pb-1 text-lg font-semibold">
            Biggest gaps first
          </h2>
          <div className="@container">
            <table className="w-full border-collapse">
              <caption className="sr-only">Sets by the gap between the set price and the sum of its parts</caption>
              <thead>
                <tr className="text-muted text-right text-xs whitespace-nowrap">
                  <th scope="col" className="py-2 pr-2 pl-[18px] text-left font-medium">
                    Set
                  </th>
                  <th scope="col" className="px-2 py-2 font-medium">
                    Set price
                  </th>
                  <th scope="col" className="px-2 py-2 font-medium">
                    All parts
                  </th>
                  <th scope="col" aria-sort="descending" className="text-ink px-2 py-2 font-medium">
                    Gap ↓
                  </th>
                  <th scope="col" className="px-2 py-2 text-left font-medium @max-[560px]:hidden">
                    Best way to sell
                  </th>
                  <th scope="col" className="py-2 pr-[18px] pl-2 font-medium @max-[760px]:hidden">
                    Set trades/day
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <SetLine key={r.slug} row={r} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-line text-muted border-t px-[18px] pt-3 pb-4 text-xs leading-relaxed">
            7-day medians of completed trades. A part needed twice counts twice. Gaps under {MIN_GAP.plat}p or{" "}
            {MIN_GAP.share * 100}% of the set price are treated as no difference. Open a set to see each part.
          </p>
        </section>
      )}
    </main>
  );
}

function SetLine({ row: r }: { row: SetRow }) {
  const advice = setAdvice(r);
  const gap = r.gap!;
  return (
    <tr className="border-line hover:bg-raised/60 border-t">
      <td className="py-2.5 pr-2 pl-[18px]">
        <Link href={`/items/${r.slug}`} className="hover:text-accent flex items-center gap-2.5">
          <span className="flex-none @max-[380px]:hidden">
            <ItemIcon name={r.name} thumb={r.thumb} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-medium">{r.name}</span>
            <span className="text-muted text-xs">
              {r.parts.reduce((a, p) => a + p.qty, 0)} parts
              <span className="hidden @max-[560px]:inline"> · {ADVICE[advice].label.toLowerCase()}</span>
            </span>
          </span>
        </Link>
      </td>
      <td className="num px-2 py-2.5 text-right">{plat(r.price!)}</td>
      <td className="num px-2 py-2.5 text-right">{plat(r.partsTotal!)}</td>
      <td className="num px-2 py-2.5 text-right font-medium whitespace-nowrap">
        <span className={advice === "set" ? "text-up" : advice === "parts" ? "text-down" : "text-muted"}>
          {gap >= 0 ? "+" : "−"}
          {plat(Math.abs(gap))}
        </span>
        <span className="text-muted block text-[11px] font-normal">{gap >= 0 ? "set dearer" : "parts dearer"}</span>
      </td>
      <td className="px-2 py-2.5 @max-[560px]:hidden">
        <span
          className={`inline-block rounded-full border px-2.5 text-xs leading-6 whitespace-nowrap ${ADVICE[advice].tone}`}
        >
          {ADVICE[advice].label}
        </span>
      </td>
      <td className="num text-muted py-2.5 pr-[18px] pl-2 text-right @max-[760px]:hidden">{compact(r.vol)}</td>
    </tr>
  );
}
