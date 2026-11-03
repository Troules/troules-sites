import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkline } from "@/components/charts";
import { ItemIcon } from "@/components/item-icon";
import { Tabs } from "@/components/tabs";
import { compact, plat, trendText } from "@/lib/format";
import { getMeta, getRows } from "@/lib/market";
import { biggestDrop, SORTS, top, variantLabel, type Sort } from "@/lib/rank";
import type { Row } from "@/lib/types";

export default async function Dashboard() {
  const [rows, meta] = await Promise.all([getRows(), getMeta()]);
  const byPlat = top(rows, "plat", 1)[0];
  const byVol = top(rows, "volume", 1)[0];
  const rise = top(rows, "trend", 1)[0];
  const drop = biggestDrop(rows);

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 pt-6 pb-6">
      <h1 className="sr-only">Warframe market dashboard</h1>

      <section aria-label="Market summary" className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <Tile label="Top seller by plat/day" row={byPlat}>
          {byPlat && (
            <>
              {compact(byPlat.plat7)}
              <Unit> p/day</Unit>
            </>
          )}
        </Tile>
        <Tile label="Most traded" row={byVol}>
          {byVol && (
            <>
              {compact(byVol.vol7)}
              <Unit> trades/day</Unit>
            </>
          )}
        </Tile>
        <Tile label="Biggest 7d rise" row={rise}>
          {rise?.trend7 != null && <Trend value={rise.trend7} />}
        </Tile>
        <Tile label="Biggest 7d drop" row={drop}>
          {drop?.trend7 != null && <Trend value={drop.trend7} />}
        </Tile>
      </section>

      <div className="flex flex-wrap items-start gap-5">
        <section
          aria-labelledby="top10"
          className="border-line bg-panel min-w-0 flex-[999_1_640px] rounded-[14px] border"
        >
          <div className="px-[18px] pt-4">
            <h2 id="top10" className="text-base font-semibold">
              Top 10
            </h2>
          </div>
          <Tabs
            label="Sort the top 10 by"
            className="[&>[role=tablist]]:mx-[18px] [&>[role=tablist]]:mt-3"
            tabs={SORTS.map((s) => ({
              id: s.id,
              label: s.label,
              panel: <TopTable rows={top(rows, s.id)} sort={s.id} hint={s.hint} />,
            }))}
          />
          <p className="border-line text-muted border-t px-[18px] pt-3 pb-4 text-xs">
            {meta.sample
              ? `Sample: ${meta.tracked} hand-picked items. The daily sweep will rank all ${meta.catalogSize.toLocaleString("en-US")}.`
              : `All ${meta.catalogSize.toLocaleString("en-US")} items, updated daily.`}
          </p>
        </section>

        <aside className="flex flex-[1_1_300px] flex-col gap-5">
          <section className="border-line-strong rounded-[14px] border border-dashed p-[18px]">
            <h2 className="text-[15px] font-semibold">My stash</h2>
            <p className="text-muted mt-1.5 text-[13px] leading-normal">
              Coming soon: your own items ranked by plat/day, with a suggested sell price for each.
            </p>
          </section>
          <section className="border-line-strong rounded-[14px] border border-dashed p-[18px]">
            <h2 className="text-[15px] font-semibold">More panels later</h2>
            <ul className="text-muted mt-2 list-disc pl-[18px] text-[13px] leading-[1.7]">
              <li>Biggest movers this week</li>
              <li>Ducats per plat (for Baro)</li>
              <li>Vaulted items</li>
              <li>Set vs parts: is it worth splitting?</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Tile({ label, row, children }: { label: string; row: Row | undefined; children: ReactNode }) {
  return (
    <div className="border-line bg-panel rounded-xl border px-4 py-3.5">
      <div className="text-muted text-xs">{label}</div>
      {row ? (
        <>
          <Link href={`/items/${row.slug}`} className="hover:text-accent mt-1.5 block font-semibold">
            {row.name}
            <span className="text-muted font-normal"> · {variantLabel(row, row.maxRank)}</span>
          </Link>
          <div className="num mt-0.5 text-xl">{children}</div>
        </>
      ) : (
        <div className="text-muted mt-1.5">No data</div>
      )}
    </div>
  );
}

const Unit = ({ children }: { children: ReactNode }) => <span className="text-muted text-[13px]">{children}</span>;

function Trend({ value }: { value: number }) {
  return <span className={value >= 0 ? "text-up" : "text-down"}>{trendText(value)}</span>;
}

const COLS: { id: Sort | null; label: string }[] = [
  { id: "price", label: "Median" },
  { id: "volume", label: "Trades/day" },
  { id: "plat", label: "Plat/day" },
  { id: "trend", label: "7d" },
];

function TopTable({ rows, sort, hint }: { rows: Row[]; sort: Sort; hint: string }) {
  return (
    <>
      <p className="text-muted px-[18px] pt-2.5 pb-1 text-xs">{hint}.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <caption className="sr-only">Top 10 items by {SORTS.find((s) => s.id === sort)!.label.toLowerCase()}</caption>
          <thead>
            <tr className="text-muted text-right text-xs">
              <th scope="col" className="w-7 py-2 pr-2.5 pl-[18px] text-left font-medium">
                #
              </th>
              <th scope="col" className="px-2.5 py-2 text-left font-medium">
                Item
              </th>
              {COLS.map((c) => (
                <th
                  key={c.label}
                  scope="col"
                  aria-sort={c.id === sort ? "descending" : undefined}
                  className={`px-2.5 py-2 font-medium ${c.id === sort ? "text-ink" : ""}`}
                >
                  {c.label}
                  {c.id === sort ? " ↓" : ""}
                </th>
              ))}
              <th scope="col" className="py-2 pr-[18px] pl-2.5 font-medium">
                30 days
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.slug}-${r.rank}-${r.subtype}`} className="border-line border-t hover:bg-[#161a23]">
                <td className="num text-muted py-2.5 pr-2.5 pl-[18px]">{i + 1}</td>
                <td className="p-2.5">
                  <Link href={`/items/${r.slug}`} className="hover:text-accent flex items-center gap-2.5">
                    <ItemIcon name={r.name} thumb={r.thumb} />
                    <span className="flex flex-col">
                      <span className="font-medium">{r.name}</span>
                      <span className="num text-muted text-xs">{variantLabel(r, r.maxRank)}</span>
                    </span>
                  </Link>
                </td>
                <td className="num p-2.5 text-right">{plat(r.price7)}</td>
                <td className="num p-2.5 text-right">{compact(r.vol7)}</td>
                <td className="num p-2.5 text-right font-medium">{compact(r.plat7)}</td>
                <td className="num p-2.5 text-right">
                  {r.trend7 == null ? <span className="text-muted">new</span> : <Trend value={r.trend7} />}
                </td>
                <td className="py-2.5 pr-[18px] pl-2.5 text-right">
                  <Sparkline values={r.spark30} label={`${r.name}: daily median over the last 30 days`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
