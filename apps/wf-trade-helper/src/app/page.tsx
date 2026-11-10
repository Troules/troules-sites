import Link from "next/link";
import type { ReactNode } from "react";
import { ItemIcon } from "@/components/item-icon";
import { StashCard } from "@/components/stash-card";
import { Timing } from "@/components/timing";
import { TopBoard } from "@/components/top-board";
import { Trend } from "@/components/top-row";
import { cheapestDucats } from "@/lib/ducats";
import { compact, plat } from "@/lib/format";
import { getDucats, getMarketProfile, getMeta, getRankUps, getRows, getSets, getVosforPrices } from "@/lib/market";
import { FIRST_ROWS, movers, pulse, SORTS, TOP_LIMIT, top, type Pulse, type Sort } from "@/lib/rank";
import { rankedSets, setAdvice } from "@/lib/sets";
import type { RankUp } from "@/lib/signals";
import type { Row } from "@/lib/types";
import { valueCollections } from "@/lib/vosfor";
import { COLLECTIONS } from "@/lib/vosfor-data";

export default async function Dashboard() {
  const [rows, meta, rankUps, profile] = await Promise.all([getRows(), getMeta(), getRankUps(), getMarketProfile()]);
  const lists = Object.fromEntries(SORTS.map((s) => [s.id, top(rows, s.id, TOP_LIMIT)])) as Record<Sort, Row[]>;
  const first = Object.fromEntries(SORTS.map((s) => [s.id, lists[s.id].slice(0, FIRST_ROWS)])) as Record<Sort, Row[]>;
  const totals = Object.fromEntries(SORTS.map((s) => [s.id, lists[s.id].length])) as Record<Sort, number>;
  const moving = movers(rows, 5);
  const market = pulse(rows);

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 pt-7 pb-6 sm:px-5">
      <section aria-labelledby="pulse" className="flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
        <div className="min-w-0 flex-[1_1_420px]">
          <h1 id="pulse" className="text-[30px] leading-[1.1] font-semibold sm:text-[38px]">
            What sells in Warframe right now
          </h1>
          <p className="text-muted mt-2.5 max-w-[60ch] text-[15px] leading-relaxed">
            <span className="num text-ink">{compact(market.plat)}</span> platinum changes hands a day across{" "}
            <span className="num text-ink">{meta.tracked.toLocaleString("en-US")}</span> items. Every price here is a
            7-day median of completed trades, not what sellers are asking.
          </p>
        </div>
        <Breadth market={market} />
      </section>

      <section aria-label="Market summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Most plat traded" row={lists.plat[0]}>
          {lists.plat[0] && (
            <>
              {compact(lists.plat[0].plat7)}
              <Unit> p/day</Unit>
            </>
          )}
        </Tile>
        <Tile label="Most trades" row={lists.volume[0]}>
          {lists.volume[0] && (
            <>
              {compact(lists.volume[0].vol7)}
              <Unit> a day</Unit>
            </>
          )}
        </Tile>
        <Tile label="Biggest rise, 7 days" row={moving.up[0]}>
          {moving.up[0]?.trend7 != null && <Trend value={moving.up[0].trend7} />}
        </Tile>
        <Tile label="Biggest drop, 7 days" row={moving.down[0]}>
          {moving.down[0]?.trend7 != null && <Trend value={moving.down[0].trend7} />}
        </Tile>
      </section>

      <div className="flex flex-wrap items-start gap-5">
        <section aria-labelledby="top" className="panel min-w-0 flex-[999_1_640px]">
          <div className="px-[18px] pt-4">
            <h2 id="top" className="text-lg font-semibold">
              Top {TOP_LIMIT}
            </h2>
          </div>
          <TopBoard first={first} totals={totals} limit={TOP_LIMIT} />
          <p className="border-line text-muted border-t px-[18px] pt-3 pb-4 text-xs">
            {meta.sample
              ? `Sample: ${meta.tracked} hand-picked items. The live site ranks all ${meta.catalogSize.toLocaleString("en-US")}.`
              : `All ${meta.catalogSize.toLocaleString("en-US")} items, updated daily.`}
          </p>
        </section>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <section aria-labelledby="stash" className="panel border-line-strong p-[18px]">
            <h2 id="stash" className="text-lg font-semibold">
              My stash
            </h2>
            <StashCard />
          </section>
          <Movers up={moving.up} down={moving.down} />
          <Tools />
        </aside>
      </div>

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
    </main>
  );
}

/** How many liquid prices rose, held and fell this week, as one bar: the market's mood at a glance. */
function Breadth({ market }: { market: Pulse }) {
  const total = market.rising + market.flat + market.falling;
  if (!total) return null;
  const share = (n: number) => `${(n / total) * 100}%`;
  return (
    <figure className="m-0 w-full max-w-[380px] flex-[1_1_300px]">
      <figcaption className="text-muted text-xs">Prices this week, items trading at least 3 times a day</figcaption>
      <div
        role="img"
        aria-label={`${market.rising} rising, ${market.flat} steady, ${market.falling} falling`}
        className="mt-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full"
      >
        <span className="bg-up" style={{ width: share(market.rising) }} />
        <span className="bg-line-strong" style={{ width: share(market.flat) }} />
        <span className="bg-down" style={{ width: share(market.falling) }} />
      </div>
      <p aria-hidden="true" className="num mt-1.5 flex justify-between text-[13px]">
        <span className="text-up">▲ {market.rising} rising</span>
        <span className="text-muted">{market.flat} steady</span>
        <span className="text-down">▼ {market.falling} falling</span>
      </p>
    </figure>
  );
}

function Tile({ label, row, children }: { label: string; row: Row | undefined; children: ReactNode }) {
  return (
    <div className="panel min-w-0 px-4 py-3.5">
      <div className="text-muted text-xs">{label}</div>
      {row ? (
        <Link href={`/items/${row.slug}`} className="group mt-2 flex items-center gap-3">
          <ItemIcon name={row.name} thumb={row.thumb} size={40} />
          <span className="min-w-0">
            <span className="group-hover:text-accent block truncate font-semibold">{row.name}</span>
            <span className="num block text-xl leading-tight">{children}</span>
          </span>
        </Link>
      ) : (
        <div className="text-muted mt-2">No data</div>
      )}
    </div>
  );
}

const Unit = ({ children }: { children: ReactNode }) => <span className="text-muted text-[13px]">{children}</span>;

function Movers({ up, down }: { up: Row[]; down: Row[] }) {
  return (
    <section aria-labelledby="movers" className="panel p-[18px]">
      <h2 id="movers" className="text-lg font-semibold">
        Movers this week
      </h2>
      <p className="text-muted mt-1 text-xs leading-normal">7-day median against the 30 days before.</p>
      <MoverList title="Rising" rows={up} empty="Nothing rose this week." />
      <MoverList title="Falling" rows={down} empty="Nothing fell this week." />
    </section>
  );
}

function MoverList({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  return (
    <>
      <h3 className="mt-3.5 text-[13px] font-semibold">{title}</h3>
      {rows.length ? (
        <ul className="mt-1">
          {rows.map((r) => (
            <li key={`${r.slug}-${r.rank}-${r.subtype}`} className="border-line border-t first:border-t-0">
              <Link href={`/items/${r.slug}`} className="group flex items-center gap-2.5 py-1.5">
                <ItemIcon name={r.name} thumb={r.thumb} size={26} />
                <span className="group-hover:text-accent min-w-0 flex-1 truncate">{r.name}</span>
                <span className="num text-muted">{plat(r.price7)}</span>
                <span className="num w-[68px] text-right">
                  <Trend value={r.trend7!} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted mt-1 text-[13px]">{empty}</p>
      )}
    </>
  );
}

/** The three calculators, each with today's headline from its own page, so the link already says something. */
async function Tools() {
  const [sets, ducats, vosfor] = await Promise.all([getSets(), getDucats(), getVosforPrices()]);
  const set = rankedSets(sets)[0];
  const ducat = cheapestDucats(ducats)[0];
  const packs = valueCollections(COLLECTIONS, new Map(vosfor.map((p) => [p.slug, p])));
  const pack = packs.reduce((a, b) => (b.recyclePack > a.recyclePack ? b : a));
  const advice = set ? setAdvice(set) : "unknown";
  return (
    <section aria-labelledby="tools" className="panel p-[18px]">
      <h2 id="tools" className="text-lg font-semibold">
        Calculators
      </h2>
      <ul className="mt-2">
        <Tool href="/sets" title="Set or parts?">
          {set && advice !== "unknown" && advice !== "same"
            ? `${set.name.replace(/ Set$/, "")} pays ${plat(Math.abs(set.gap!))} more ${advice === "set" ? "as a set" : "in parts"}.`
            : "See which sets pay more whole and which in parts."}
        </Tool>
        <Tool href="/ducats" title="Ducats for Baro">
          {ducat
            ? `${ducat.name}: ${ducat.ducats} ducats for ${plat(ducat.price)}.`
            : "Find the cheapest ducats on the market."}
        </Tool>
        <Tool href="/vosfor" title="Vosfor packs">
          {`${pack.name.replace(/ Arcane Collection$/, "")} pays about ${plat(pack.recyclePack)} a pack.`}
        </Tool>
      </ul>
    </section>
  );
}

function Tool({ href, title, children }: { href: string; title: string; children: ReactNode }) {
  return (
    <li className="border-line border-t first:border-t-0">
      <Link href={href} className="group block py-2.5">
        <span className="group-hover:text-accent font-semibold">{title}</span>
        <span className="text-muted mt-0.5 block text-[13px] leading-snug">{children}</span>
      </Link>
    </li>
  );
}

function RankUps({ rows }: { rows: RankUp[] }) {
  return (
    <section aria-labelledby="rankup" className="panel min-w-0 flex-[1_1_520px]">
      <div className="px-[18px] pt-4">
        <h2 id="rankup" className="text-lg font-semibold">
          Rank-up profit, arcanes
        </h2>
        <p className="text-muted mt-1 max-w-[70ch] text-xs leading-normal">
          Buy rank-0 copies at the 7-day median, fuse to max rank, sell at its median. Only arcanes with at least 3
          rank-0 and 1 max-rank trades a day.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted px-[18px] py-6 text-sm">No arcane pays to rank up right now.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse">
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
                <tr key={r.slug} className="border-line hover:bg-raised/60 border-t">
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
