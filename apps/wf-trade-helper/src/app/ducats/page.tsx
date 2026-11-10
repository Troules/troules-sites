import type { Metadata } from "next";
import Link from "next/link";
import { DucatPlanner } from "@/components/ducat-planner";
import { ItemIcon } from "@/components/item-icon";
import { Tabs } from "@/components/tabs";
import { cheapestDucats, worthSelling, type DucatRow } from "@/lib/ducats";
import { compact, plat } from "@/lib/format";
import { getDucats, getMeta } from "@/lib/market";

export const metadata: Metadata = {
  title: "Ducats per plat",
  description:
    "The cheapest ducats on warframe.market before Baro Ki'Teer arrives: prime parts ranked by ducats per plat, a shopping list for the ducats you need, and the parts worth too much to trade in.",
  alternates: { canonical: "/ducats" },
};

const LIMIT = 50;
/** The planner only ever buys from the top of the list; this many rows cover any target it accepts. */
const PLANNER_ROWS = 120;

export default async function DucatsPage() {
  const [rows, meta] = await Promise.all([getDucats(), getMeta()]);
  const cheapest = cheapestDucats(rows);
  const keep = worthSelling(rows);

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 pt-6 pb-6 sm:px-5">
      <nav aria-label="Breadcrumb" className="text-muted text-xs">
        <Link href="/" className="link">
          Market
        </Link>{" "}
        / Ducats per plat
      </nav>
      <div>
        <h1 className="text-[32px] leading-tight font-semibold">Ducats for Baro</h1>
        <p className="text-muted mt-1.5 max-w-[72ch] leading-relaxed">
          Baro Ki&apos;Teer sells for ducats, and a prime part is worth the same ducats whatever it costs in plat. So
          the cheap parts nobody wants are the best way to fill up before he lands, and the dear ones are better sold
          than traded in.
        </p>
        {meta.sample && (
          <p className="border-line-strong text-muted mt-3 max-w-[72ch] rounded-lg border border-dashed px-3 py-2 text-xs">
            Sample data: {rows.length} prime parts and sets. The live site ranks every one that trades daily.
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted py-10 text-center">No prime part with a ducat value traded this week.</p>
      ) : (
        <>
          <DucatPlanner rows={cheapest.slice(0, PLANNER_ROWS)} />
          <section aria-labelledby="ducat-lists" className="panel min-w-0">
            <h2 id="ducat-lists" className="px-[18px] pt-4 text-lg font-semibold">
              Prime parts by ducat value
            </h2>
            <Tabs
              label="Which list"
              className="[&>[role=tablist]]:mx-[18px] [&>[role=tablist]]:mt-3"
              tabs={[
                {
                  id: "buy",
                  label: "Cheapest ducats",
                  panel: (
                    <DucatTable
                      rows={cheapest.slice(0, LIMIT)}
                      mode="buy"
                      hint="Buy these to trade in: the most ducats for each plat spent."
                    />
                  ),
                },
                {
                  id: "keep",
                  label: "Sell, don't trade in",
                  panel: (
                    <DucatTable
                      rows={keep.slice(0, LIMIT)}
                      mode="keep"
                      hint="Trading these in throws plat away: every 100 ducats would cost you this much."
                    />
                  ),
                },
              ]}
            />
            <p className="border-line text-muted border-t px-[18px] pt-3 pb-4 text-xs leading-relaxed">
              Prices are 7-day medians of completed trades; parts trading less than once a day are left out. Ducat
              values come from warframe.market&apos;s item list.
            </p>
          </section>
        </>
      )}
    </main>
  );
}

function DucatTable({ rows, mode, hint }: { rows: DucatRow[]; mode: "buy" | "keep"; hint: string }) {
  return (
    <>
      <p className="text-muted px-[18px] pt-2.5 pb-1 text-xs">{hint}</p>
      <div className="@container">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            {mode === "buy"
              ? "Prime parts by ducats per plat, best first"
              : "Prime parts by plat per 100 ducats, dearest first"}
          </caption>
          <thead>
            <tr className="text-muted text-right text-xs whitespace-nowrap">
              <th scope="col" className="w-7 py-2 pr-2 pl-[18px] text-left font-medium @max-[440px]:hidden">
                #
              </th>
              <th scope="col" className="px-2 py-2 text-left font-medium @max-[440px]:pl-3.5">
                Item
              </th>
              <th scope="col" className="px-2 py-2 font-medium">
                Ducats
              </th>
              <th scope="col" className="px-2 py-2 font-medium">
                Median
              </th>
              <th
                scope="col"
                aria-sort="descending"
                className="text-ink px-2 py-2 font-medium @max-[440px]:pr-3.5 @max-[440px]:whitespace-normal"
              >
                {mode === "buy" ? "Ducats per plat ↓" : "Plat per 100 ducats ↓"}
              </th>
              <th scope="col" className="py-2 pr-[18px] pl-2 font-medium @max-[520px]:hidden">
                Trades/day
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.slug} className="border-line hover:bg-raised/60 border-t">
                <td className="num text-muted py-2.5 pr-2 pl-[18px] @max-[440px]:hidden">{i + 1}</td>
                <td className="px-2 py-2.5 @max-[440px]:pl-3.5">
                  <Link href={`/items/${r.slug}`} className="hover:text-accent flex items-center gap-2.5">
                    <span className="flex-none @max-[380px]:hidden">
                      <ItemIcon name={r.name} thumb={r.thumb} />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-muted text-xs">{r.kind}</span>
                    </span>
                  </Link>
                </td>
                <td className="num px-2 py-2.5 text-right">{r.ducats}</td>
                <td className="num px-2 py-2.5 text-right">{plat(r.price)}</td>
                <td className="num px-2 py-2.5 text-right font-medium @max-[440px]:pr-3.5">
                  {mode === "buy" ? r.perPlat.toFixed(1) : plat(r.platPer100)}
                </td>
                <td className="num text-muted py-2.5 pr-[18px] pl-2 text-right @max-[520px]:hidden">
                  {compact(r.vol)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
