import Link from "next/link";
import type { ReactNode } from "react";
import { ItemIcon } from "@/components/item-icon";
import { MoreRows } from "@/components/more-rows";
import { Tabs } from "@/components/tabs";
import { Timing } from "@/components/timing";
import { TopHead, TopRow, Trend } from "@/components/top-row";
import { compact, plat } from "@/lib/format";
import { getMarketProfile, getMeta, getRankUps, getRows } from "@/lib/market";
import { biggestDrop, FIRST_ROWS, SORTS, TOP_LIMIT, top, variantLabel, type Sort } from "@/lib/rank";
import type { RankUp } from "@/lib/signals";
import type { Row } from "@/lib/types";

export default async function Dashboard() {
  const [rows, meta, rankUps, profile] = await Promise.all([getRows(), getMeta(), getRankUps(), getMarketProfile()]);
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
        <RankUps rows={rankUps.slice(0, 8)} />
        <div className="min-w-0 flex-[1_1_520px]">
          <Timing
            id="timing"
            hours={profile.hours}
            weekdays={profile.weekdays}
            scope="whole market"
            note={`${profile.items.hourly.toLocaleString("en-US")} items by hour, ${profile.items.weekly.toLocaleString("en-US")} by weekday`}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section
          aria-labelledby="top10"
          className="border-line bg-panel min-w-0 flex-[999_1_640px] rounded-[14px] border"
        >
          <div className="px-[18px] pt-4">
            <h2 id="top10" className="text-base font-semibold">
              Top {TOP_LIMIT}
            </h2>
          </div>
          <Tabs
            label={`Sort the top ${TOP_LIMIT} by`}
            className="[&>[role=tablist]]:mx-[18px] [&>[role=tablist]]:mt-3"
            tabs={SORTS.map((s) => ({
              id: s.id,
              label: s.label,
              panel: <TopTable rows={top(rows, s.id, TOP_LIMIT)} sort={s.id} hint={s.hint} />,
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

function TopTable({ rows, sort, hint }: { rows: Row[]; sort: Sort; hint: string }) {
  const first = rows.slice(0, FIRST_ROWS);
  return (
    <>
      <p className="text-muted px-[18px] pt-2.5 pb-1 text-xs">{hint}.</p>
      <div className="@container">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            Top {rows.length} items by {SORTS.find((s) => s.id === sort)!.label.toLowerCase()}, the first {first.length}{" "}
            shown, more as you scroll
          </caption>
          <TopHead sort={sort} />
          <tbody>
            {first.map((r, i) => (
              <TopRow key={`${r.slug}-${r.rank}-${r.subtype}`} row={r} n={i + 1} sort={sort} />
            ))}
          </tbody>
          {rows.length > first.length && <MoreRows sort={sort} first={first.length} total={rows.length} />}
        </table>
      </div>
    </>
  );
}

function RankUps({ rows }: { rows: RankUp[] }) {
  return (
    <section aria-labelledby="rankup" className="border-line bg-panel min-w-0 flex-[1_1_520px] rounded-[14px] border">
      <div className="px-[18px] pt-4">
        <h2 id="rankup" className="text-base font-semibold">
          Rank-up profit · arcanes
        </h2>
        <p className="text-muted mt-1 text-xs leading-normal">
          Buy rank-0 copies at the 7-day median, fuse to max rank, sell at its median. Only arcanes with at least 3
          rank-0 and 1 max-rank trades a day.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted px-[18px] py-6 text-sm">No arcane pays to rank up right now.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <caption className="sr-only">Arcanes by profit from ranking up, best first</caption>
            <thead>
              <tr className="text-muted text-right text-xs">
                <th scope="col" className="py-2 pr-2.5 pl-[18px] text-left font-medium">
                  Arcane
                </th>
                <th scope="col" className="px-2.5 py-2 font-medium">
                  Cost
                </th>
                <th scope="col" className="px-2.5 py-2 font-medium">
                  Sells for
                </th>
                <th scope="col" aria-sort="descending" className="text-ink px-2.5 py-2 font-medium">
                  Profit ↓
                </th>
                <th scope="col" className="py-2 pr-[18px] pl-2.5 font-medium">
                  Max-rank trades/day
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.slug} className="border-line border-t hover:bg-[#161a23]">
                  <td className="py-2.5 pr-2.5 pl-[18px]">
                    <Link href={`/items/${r.slug}`} className="hover:text-accent flex items-center gap-2.5">
                      <ItemIcon name={r.name} thumb={r.thumb} />
                      <span className="flex flex-col">
                        <span className="font-medium">{r.name}</span>
                        <span className="num text-muted text-xs">
                          {r.copies} × {plat(r.r0)} → rank {r.maxRank}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="num p-2.5 text-right">{plat(r.cost)}</td>
                  <td className="num p-2.5 text-right">{plat(r.max)}</td>
                  <td className="num text-up p-2.5 text-right font-medium">
                    +{plat(r.profit)}
                    <span className="text-muted block text-[11px] font-normal">
                      {Math.round((r.profit / r.cost) * 100)}% margin
                    </span>
                  </td>
                  <td className="num py-2.5 pr-[18px] pl-2.5 text-right">{compact(r.volMax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
