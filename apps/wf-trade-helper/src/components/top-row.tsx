import Link from "next/link";
import { Sparkline } from "@/components/charts";
import { ItemIcon } from "@/components/item-icon";
import { compact, plat, trendText } from "@/lib/format";
import { variantLabel, type Sort } from "@/lib/rank";
import { volatility } from "@/lib/signals";
import type { Row } from "@/lib/types";

/**
 * Header and row of the top-100 table, rendered by TopBoard (on the server for the first paint, then in the
 * browser as more rows load).
 *
 * The table never scrolls sideways: it lives in a size container, and the least useful columns drop out as that
 * container narrows (the column the list is sorted by always stays).
 */
type Col = { id: string; label: string; sort?: Sort; hide?: string; left?: boolean };

export const COLUMNS: Col[] = [
  { id: "price", label: "Median", sort: "price" },
  { id: "volume", label: "Trades/day", sort: "volume", hide: "@max-[620px]:hidden" },
  { id: "plat", label: "Plat/day", sort: "plat" },
  { id: "trend", label: "7d", sort: "trend", hide: "@max-[460px]:hidden" },
  { id: "high", label: "vs 90d", sort: "high", hide: "@max-[540px]:hidden" },
  { id: "vol", label: "Volatility", hide: "@max-[720px]:hidden", left: true },
  { id: "spark", label: "30 days", hide: "@max-[840px]:hidden" },
];

/** Every column plus # and Item, for colSpan. */
export const COLUMN_COUNT = COLUMNS.length + 2;

const hidden = (c: Col, sort: Sort) => (c.sort === sort ? "" : (c.hide ?? ""));

export function TopHead({ sort }: { sort: Sort }) {
  return (
    <thead>
      <tr className="text-muted text-right text-xs whitespace-nowrap">
        <th scope="col" className="w-7 py-2 pr-2 pl-[18px] text-left font-medium">
          #
        </th>
        <th scope="col" className="px-2 py-2 text-left font-medium">
          Item
        </th>
        {COLUMNS.map((c) => (
          <th
            key={c.id}
            scope="col"
            aria-sort={c.sort === sort ? "descending" : undefined}
            className={`px-2 py-2 font-medium last:pr-[18px] ${c.left ? "text-left" : ""} ${c.sort === sort ? "text-ink" : ""} ${hidden(c, sort)}`}
          >
            {c.label}
            {c.sort === sort ? " ↓" : ""}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TopRow({ row: r, n, sort }: { row: Row; n: number; sort: Sort }) {
  const cell: Record<string, React.ReactNode> = {
    price: plat(r.price7),
    volume: compact(r.vol7),
    plat: <span className="font-medium">{compact(r.plat7)}</span>,
    trend: r.trend7 == null ? <span className="text-muted">new</span> : <Trend value={r.trend7} />,
    high: <Position row={r} />,
    vol:
      r.cv90 == null ? (
        <span className="text-muted">—</span>
      ) : (
        <span className="flex flex-col">
          <span className="text-[13px] [font-stretch:92%]">{volatility(r.cv90).label}</span>
          <span className="text-muted text-[11px]">±{Math.round(r.cv90 * 100)}%</span>
        </span>
      ),
    spark: <Sparkline values={r.spark30} label={`${r.name}: daily median over the last 30 days`} />,
  };
  return (
    <tr className="border-line hover:bg-raised/60 border-t">
      <td className="num text-muted py-2.5 pr-2 pl-[18px]">{n}</td>
      <td className="px-2 py-2.5">
        <Link href={`/items/${r.slug}`} className="hover:text-accent flex items-center gap-2.5">
          <ItemIcon name={r.name} thumb={r.thumb} />
          <span className="flex min-w-0 flex-col">
            <span className="font-medium">{r.name}</span>
            <span className="text-muted text-xs">{variantLabel(r, r.maxRank)}</span>
          </span>
        </Link>
      </td>
      {COLUMNS.map((c) => (
        <td
          key={c.id}
          className={`num px-2 py-2.5 whitespace-nowrap last:pr-[18px] ${c.left ? "" : "text-right"} ${hidden(c, sort)}`}
        >
          {cell[c.id]}
        </td>
      ))}
    </tr>
  );
}

export function Trend({ value }: { value: number }) {
  return <span className={value >= 0 ? "text-up" : "text-down"}>{trendText(value)}</span>;
}

/** Percentile of the 7-day median within the last 90 days, with the 90-day range of daily medians underneath. */
function Position({ row }: { row: Row }) {
  if (row.pos90 == null) return <span className="text-muted">—</span>;
  const pct = Math.round(row.pos90 * 100);
  return (
    <span className="flex flex-col items-end">
      <span className={pct >= 80 ? "text-up" : pct <= 20 ? "text-down" : ""}>{pct}%</span>
      <span className="text-muted text-[11px] [font-variant-numeric:normal]">
        {Math.round(row.lo90!).toLocaleString("en-US")}–{plat(row.hi90!)}
      </span>
    </span>
  );
}
