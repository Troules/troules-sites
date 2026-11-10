import Link from "next/link";
import { ItemIcon } from "@/components/item-icon";
import { compact, plat } from "@/lib/format";
import { setAdvice, type SetRow } from "@/lib/sets";

/** One sentence: which way of selling this set pays more, or why we can't say. */
export function adviceText(set: SetRow): string {
  const advice = setAdvice(set);
  if (advice === "unknown")
    return set.price == null
      ? "The set has no recent trades, so it can't be compared with its parts."
      : "At least one part has no recent trades, so the parts can't be added up.";
  const thin = set.liquid ? "" : " Some of these trade less than once a day, so the medians are rough.";
  if (advice === "same") return `Selling the set or the parts pays about the same.${thin}`;
  const gap = plat(Math.abs(set.gap!));
  return advice === "set"
    ? `The set sells for ${gap} more than its parts: keep it together, or buy the parts and resell the set.${thin}`
    : `The parts sell for ${gap} more than the set: list them one by one.${thin}`;
}

/** A set's parts with quantity, price and trades per day, then the sum against the set's own price. */
export function SetBreakdown({ set, current }: { set: SetRow; current?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-[13px]">
        <caption className="sr-only">Parts of {set.name} and what they sell for</caption>
        <thead>
          <tr className="text-muted text-right text-xs">
            <th scope="col" className="py-2 pr-2 text-left font-medium">
              Part
            </th>
            <th scope="col" className="px-2 py-2 font-medium">
              In a set
            </th>
            <th scope="col" className="px-2 py-2 font-medium">
              Median
            </th>
            <th scope="col" className="py-2 pl-2 font-medium">
              Trades/day
            </th>
          </tr>
        </thead>
        <tbody>
          {set.parts.map((p) => (
            <tr key={p.slug} className="border-line border-t">
              <th scope="row" className="py-2 pr-2 text-left font-normal">
                <Link
                  href={`/items/${p.slug}`}
                  aria-current={p.slug === current ? "page" : undefined}
                  className={`hover:text-accent flex items-center gap-2.5 ${p.slug === current ? "font-semibold" : ""}`}
                >
                  <ItemIcon name={p.name} thumb={p.thumb} size={26} />
                  {p.name}
                </Link>
              </th>
              <td className="num px-2 py-2 text-right">× {p.qty}</td>
              <td className="num px-2 py-2 text-right">{p.price == null ? "—" : plat(p.price)}</td>
              <td className="num text-muted py-2 pl-2 text-right">{compact(p.vol)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-line-strong border-t">
            <th scope="row" colSpan={2} className="py-2 pr-2 text-left font-medium">
              All parts
            </th>
            <td className="num px-2 py-2 text-right font-medium">
              {set.partsTotal == null ? "—" : plat(set.partsTotal)}
            </td>
            <td />
          </tr>
          <tr className="border-line border-t">
            <th scope="row" colSpan={2} className="py-2 pr-2 text-left font-medium">
              <Link
                href={`/items/${set.slug}`}
                aria-current={set.slug === current ? "page" : undefined}
                className="hover:text-accent"
              >
                {set.name}
              </Link>
            </th>
            <td className="num px-2 py-2 text-right font-medium">{set.price == null ? "—" : plat(set.price)}</td>
            <td className="num text-muted py-2 pl-2 text-right">{compact(set.vol)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
