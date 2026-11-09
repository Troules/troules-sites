import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { PriceChart } from "@/components/charts";
import { CopyButton } from "@/components/copy-button";
import { ItemIcon } from "@/components/item-icon";
import { Tabs } from "@/components/tabs";
import { Timing } from "@/components/timing";
import { compact, plat, trendText } from "@/lib/format";
import { getItemMarket, getMeta, getPrerenderSlugs } from "@/lib/market";
import { variantLabel } from "@/lib/rank";
import { matching, suggestPrice } from "@/lib/sell";
import { hourProfile, signalsFor, volatility, weekdayProfile } from "@/lib/signals";
import type { Book, CatalogItem, Order } from "@/lib/types";
import { lastDays, variants, type Variant } from "@/lib/variants";

// Items with market data are prerendered; any other catalog item gets the App Shell, then its own cached page
// after the first visit. Unknown slugs never get here: proxy.ts answers them with a 404.
export async function generateStaticParams() {
  return (await getPrerenderSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/items/[slug]">): Promise<Metadata> {
  const data = await getItemMarket((await params).slug);
  if (!data) return {};
  return {
    title: `${data.item.name} price`,
    description: `${data.item.name}: median price, trades per day and 90-day history on warframe.market, with a suggested sell price.`,
    alternates: { canonical: `/items/${data.item.slug}` },
  };
}

export default function ItemPage({ params }: PageProps<"/items/[slug]">) {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 pt-6 pb-6">
      <Suspense fallback={<p className="text-muted py-24 text-center">Loading item…</p>}>
        <ItemDetails params={params} />
      </Suspense>
    </main>
  );
}

async function ItemDetails({ params }: Pick<PageProps<"/items/[slug]">, "params">) {
  const { slug } = await params;
  const [data, meta] = await Promise.all([getItemMarket(slug), getMeta()]);
  if (!data) notFound();
  const { item, summaries, history, hourly, book } = data;
  const vs = variants(item, summaries, history, hourly);

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-muted text-xs">
        <Link href="/" className="text-accent underline underline-offset-2">
          Dashboard
        </Link>{" "}
        / {item.kind} / {item.name}
      </nav>
      <div className="flex flex-wrap items-center gap-4">
        <ItemIcon name={item.name} thumb={item.thumb} size={56} />
        <div className="flex-[1_1_260px]">
          <h1 className="text-[26px] font-semibold">{item.name}</h1>
          <p className="text-muted mt-1">
            {item.kind}
            {item.maxRank != null ? ` · max rank ${item.maxRank}` : ""} · PC + crossplay
          </p>
        </div>
      </div>
      {vs.length === 0 ? (
        <NoData item={item} sample={meta.sample} />
      ) : vs.length === 1 ? (
        <VariantView item={item} v={vs[0]!} book={book} asOf={meta.asOf} />
      ) : (
        <Tabs
          label="Rank"
          className="flex flex-col gap-5 [&>[role=tabpanel]]:-mt-0"
          tabs={vs.map((v) => ({
            id: `${v.rank}-${v.subtype}`,
            label: variantLabel(v, item.maxRank),
            panel: <VariantView item={item} v={v} book={book} asOf={meta.asOf} />,
          }))}
        />
      )}
    </>
  );
}

function NoData({ item, sample }: { item: CatalogItem; sample: boolean }) {
  return (
    <section className="border-line-strong rounded-[14px] border border-dashed p-6">
      <h2 className="text-base font-semibold">No price history here yet</h2>
      <p className="text-muted mt-2 leading-relaxed">
        {sample
          ? "This build only has a sample of items. The daily sweep will add every item."
          : "Nobody completed a trade for this item in the last 90 days."}{" "}
        <a href={`https://warframe.market/items/${item.slug}`} className="text-accent underline underline-offset-2">
          See its orders on warframe.market
        </a>
        .
      </p>
    </section>
  );
}

function VariantView({ item, v, book, asOf }: { item: CatalogItem; v: Variant; book: Book; asOf: string }) {
  const s = v.summary;
  const label = variantLabel(v, item.maxRank).toLowerCase();
  const id = `v-${v.rank}-${v.subtype}`;
  const ranges = [90, 30, 7].map((n) => ({ n, days: lastDays(v.days, asOf, n) }));
  const range90 = ranges[0]!.days.map((d) => d.median);
  const sig = s ? signalsFor(range90, s.price7) : null;

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-label={`Key numbers, ${label}`}
        className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3"
      >
        <Stat label="Median, 7 days">{s ? plat(s.price7) : "—"}</Stat>
        <Stat label="Trades per day">{s ? compact(s.vol7) : "—"}</Stat>
        <Stat label="Plat per day">{s ? compact(s.plat7) : "—"}</Stat>
        <Stat label="7d vs previous 30d">
          {s?.trend7 != null ? (
            <span className={s.trend7 >= 0 ? "text-up" : "text-down"}>{trendText(s.trend7)}</span>
          ) : (
            "—"
          )}
        </Stat>
        <Stat label="Median range, 90 days">
          {range90.length ? `${Math.min(...range90)}–${Math.max(...range90)}p` : "—"}
        </Stat>
        <Stat label="7d median vs 90 days">
          {sig?.pos90 != null ? (
            <>
              {Math.round(sig.pos90 * 100)}%
              <span className="text-muted text-[13px]">
                {sig.pos90 >= 0.8 ? " near the high" : sig.pos90 <= 0.2 ? " near the low" : " mid-range"}
              </span>
            </>
          ) : (
            "—"
          )}
        </Stat>
        <Stat label="Volatility, 90 days">
          {sig?.cv90 != null ? (
            <>
              {volatility(sig.cv90).label}
              <span className="text-muted text-[13px]"> ±{Math.round(sig.cv90 * 100)}%</span>
            </>
          ) : (
            "—"
          )}
        </Stat>
      </section>

      <div className="flex flex-wrap items-start gap-5">
        <section
          aria-label={`Price history, ${label}`}
          className="border-line bg-panel min-w-0 flex-[999_1_640px] rounded-[14px] border px-[18px] py-4"
        >
          <h2 className="text-base font-semibold">Price history · {label}</h2>
          <p className="text-muted mt-1 text-xs">Completed trades per day, up to {asOf}</p>
          <Tabs
            label="Period"
            className="mt-3 [&>[role=tabpanel]]:mt-3.5"
            tabs={ranges.map((r) => ({
              id: String(r.n),
              label: `${r.n}d`,
              panel: <PriceChart days={r.days} label={`${item.name} ${label}, last ${r.n} days`} />,
            }))}
          />
        </section>

        <aside className="flex flex-[1_1_320px] flex-col gap-5">
          {s ? <SellHelper id={`${id}-sell`} item={item} v={v} price7={s.price7} book={book} label={label} /> : null}
          <OrderBook id={`${id}-book`} book={book} v={v} label={label} />
        </aside>
      </div>

      <Timing
        id={`${id}-timing`}
        hours={hourProfile(v.hours)}
        weekdays={weekdayProfile(ranges[0]!.days)}
        scope={label}
      />
    </div>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-line bg-panel rounded-xl border px-4 py-3.5">
      <div className="text-muted text-xs">{label}</div>
      <div className="num mt-1 text-[22px]">{children}</div>
    </div>
  );
}

function SellHelper({
  id,
  item,
  v,
  price7,
  book,
  label,
}: {
  id: string;
  item: CatalogItem;
  v: Variant;
  price7: number;
  book: Book;
  label: string;
}) {
  const sug = suggestPrice(book, v.rank, v.subtype, price7);
  const why = {
    undercut: `1p under the cheapest online seller (${plat(sug.lowestSeller ?? 0)}).`,
    buyer: `An online buyer already pays ${plat(sug.highestBuyer ?? 0)}: sell to them now.`,
    median: "No online seller right now, so this is the 7-day median.",
  }[sug.basis];
  return (
    <section aria-labelledby={id} className="border-line-strong rounded-[14px] border bg-[rgb(22_26_35/0.86)] p-[18px]">
      <h2 id={id} className="text-base font-semibold">
        Sell helper · {label}
      </h2>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="num text-4xl font-medium">{plat(sug.price)}</span>
        <span className="text-muted">suggested price</span>
      </div>
      <p className="text-muted mt-1.5 text-[13px] leading-normal">
        {why} 7-day median: {plat(price7)}.
        {sug.highestBuyer != null && sug.basis !== "buyer" ? ` Highest online buyer: ${plat(sug.highestBuyer)}.` : ""}
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <CopyButton text={String(sug.price)} label="Copy price" />
        <a
          href={`https://warframe.market/items/${item.slug}`}
          rel="noopener"
          className="bg-accent text-bg flex min-h-11 flex-[1_1_160px] items-center justify-center gap-1.5 rounded-[10px] px-3 font-semibold"
        >
          Sell on warframe.market
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden="true"
          >
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>
      </div>
      <p className="text-muted mt-2.5 text-xs">
        One-click listing comes when warframe.market opens sign-in to other sites.
      </p>
    </section>
  );
}

function OrderBook({ id, book, v, label }: { id: string; book: Book; v: Variant; label: string }) {
  const sell = matching(book.sell, v.rank, v.subtype).slice(0, 5);
  const buy = matching(book.buy, v.rank, v.subtype).slice(0, 5);
  return (
    <section aria-labelledby={id} className="border-line bg-panel rounded-[14px] border px-[18px] py-4">
      <h2 id={id} className="text-base font-semibold">
        Online orders · {label}
      </h2>
      <div className="mt-2.5 grid grid-cols-2 items-start gap-4">
        <OrderTable title="Sellers (lowest first)" orders={sell} tone="text-down" />
        <OrderTable title="Buyers (highest first)" orders={buy} tone="text-up" />
      </div>
      <p className="text-muted mt-2.5 text-xs">Players in game or online. Player names are not shown.</p>
    </section>
  );
}

function OrderTable({ title, orders, tone }: { title: string; orders: Order[]; tone: string }) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <caption className={`pb-1.5 text-left text-xs ${tone}`}>{title}</caption>
      <thead>
        <tr className="text-muted text-[11px]">
          <th scope="col" className="py-1 text-left font-medium">
            Price
          </th>
          <th scope="col" className="text-right font-medium">
            Qty
          </th>
          <th scope="col" className="text-right font-medium">
            Rep
          </th>
        </tr>
      </thead>
      <tbody>
        {orders.length ? (
          orders.map((o, i) => (
            <tr key={i} className="border-line border-t">
              <td className="num py-1.5">{plat(o.platinum)}</td>
              <td className="num text-right">{o.quantity}</td>
              <td className="num text-muted text-right">{o.reputation}</td>
            </tr>
          ))
        ) : (
          <tr className="border-line border-t">
            <td colSpan={3} className="text-muted py-1.5">
              None online
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
