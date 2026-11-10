"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ducatPlan, type DucatRow } from "@/lib/ducats";
import { plat } from "@/lib/format";
import { chatMessages } from "@/lib/stash";
import { CopyButton } from "./copy-button";
import { ItemIcon } from "./item-icon";

const MAX_TARGET = 20_000;

/**
 * "I need N ducats": a shopping list of the cheapest ducats on the market, at most one day's trades of each part,
 * with its plat cost and a WTB message for trade chat. Runs in the browser on the rows the server rendered in.
 */
export function DucatPlanner({ rows }: { rows: DucatRow[] }) {
  const [input, setInput] = useState("500");
  const id = useId();
  const parsed = Math.floor(Number(input));
  const target = Number.isFinite(parsed) ? Math.min(MAX_TARGET, Math.max(0, parsed)) : 0;
  const plan = ducatPlan(rows, target);
  const wtb = chatMessages(
    "WTB",
    plan.lines.map((l) => ({ name: l.row.name, rank: null, subtype: null, price: l.row.price })),
  );

  return (
    <section aria-labelledby={`${id}-h`} className="panel border-line-strong p-[18px]">
      <h2 id={`${id}-h`} className="text-lg font-semibold">
        Shopping list
      </h2>
      <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-4">
        <div>
          <label htmlFor={`${id}-target`} className="text-muted block text-xs">
            Ducats you need
          </label>
          <input
            id={`${id}-target`}
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_TARGET}
            step={50}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-describedby={`${id}-cap`}
            className="field num mt-1 w-36 text-base"
          />
          <p id={`${id}-cap`} className="text-muted mt-1 text-xs">
            {parsed > MAX_TARGET
              ? `Capped at ${MAX_TARGET.toLocaleString("en-US")}.`
              : "Baro's dearest items cost a few hundred."}
          </p>
        </div>
        <p aria-live="polite" className="pb-1">
          {target === 0 ? (
            <span className="text-muted">Enter how many ducats Baro&apos;s item costs.</span>
          ) : (
            <>
              <span className="num text-[28px] leading-none font-medium">{plat(plan.plat)}</span>
              <span className="text-muted ml-2 text-[13px]">
                buys {plan.ducats.toLocaleString("en-US")} ducats
                {plan.plat > 0 ? `, ${(plan.ducats / plan.plat).toFixed(1)} per plat` : ""}
              </span>
            </>
          )}
        </p>
      </div>
      {target > 0 && !plan.reached && (
        <p className="text-down mt-2 text-[13px]">
          A day of trades at these prices only covers {plan.ducats.toLocaleString("en-US")} ducats. Buy over several
          days or pay above the median.
        </p>
      )}
      {plan.lines.length > 0 && (
        <>
          <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-x-6">
            {plan.lines.map(({ row, copies }) => (
              <li key={row.slug} className="border-line flex items-center gap-2.5 border-t py-2">
                <ItemIcon name={row.name} thumb={row.thumb} size={26} />
                <Link href={`/items/${row.slug}`} className="hover:text-accent min-w-0 flex-1 truncate">
                  {row.name}
                </Link>
                <span className="num text-muted whitespace-nowrap">
                  {copies} × {plat(row.price)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-muted mt-3 text-xs">
            At most one day of trades per part, cheapest ducats first. Paste this in trade chat to find sellers:
          </p>
          <ol className="mt-1.5 flex flex-col gap-2">
            {wtb.map((message, i) => (
              <li key={i} className="flex flex-wrap items-start gap-2">
                <p className="num bg-bg border-line min-w-0 flex-[1_1_320px] rounded-[7px] border px-3 py-2 text-[13px] leading-relaxed break-words">
                  {message}
                </p>
                <CopyButton
                  text={message}
                  label={wtb.length > 1 ? `Copy message ${i + 1}` : "Copy message"}
                  copied="Copied"
                  className="btn min-w-[150px]"
                />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
