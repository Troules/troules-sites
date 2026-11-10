"use client";

import Link from "next/link";
import { plat } from "@/lib/format";
import { byPriority, CALLS, stashLines } from "@/lib/stash";
import { ItemIcon } from "./item-icon";
import { useStashData } from "./stash-data";
import { useStash } from "./stash-store";

/**
 * The dashboard's stash panel. Without a stash (and on the server) it is an invitation; with one it shows what the
 * stash is worth and the three lines to list first.
 */
export function StashCard() {
  const stash = useStash();
  const has = !!stash?.length;
  const { data, failed } = useStashData(has);

  if (!has)
    return (
      <>
        <p className="text-muted mt-1.5 text-[13px] leading-normal">
          Add what you want to sell. You get what it is worth today, which items sit near their 90-day high, and a
          trade-chat message ready to paste.
        </p>
        <Link href="/stash" className="btn btn-primary mt-3 w-full">
          Start my stash
        </Link>
      </>
    );

  const lines = data ? byPriority(stashLines(stash, data.prices)) : [];
  const total = lines.reduce((a, l) => a + l.value, 0);
  const copies = stash.reduce((a, e) => a + e.qty, 0);
  const selling = lines.filter((l) => l.call === "sell").length;

  return (
    <>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="num text-[28px] leading-none font-medium">{data ? plat(total) : "…"}</span>
        <span className="text-muted text-[13px]">
          for {copies} {copies === 1 ? "item" : "items"} at the 7-day median
        </span>
      </p>
      {failed ? <p className="text-muted mt-2 text-[13px]">Prices didn&apos;t load. Open the stash to retry.</p> : null}
      {data ? (
        <>
          <p className="mt-1 text-[13px]">
            {selling
              ? `${selling} ${selling === 1 ? "is" : "are"} near a 90-day high: list ${selling === 1 ? "it" : "them"} today.`
              : "Nothing is near its 90-day high today."}
          </p>
          <ul className="mt-2.5">
            {lines.slice(0, 3).map((l) => {
              const item = data.bySlug.get(l.slug);
              return (
                <li key={l.key} className="border-line flex items-center gap-2.5 border-t py-2">
                  <ItemIcon name={item?.[1] ?? l.slug} thumb={item?.[2] ?? null} size={26} />
                  <Link href={`/items/${l.slug}`} className="hover:text-accent min-w-0 flex-1 truncate">
                    {item?.[1] ?? l.slug}
                  </Link>
                  <span className={`text-xs ${l.call === "sell" ? "text-up font-medium" : "text-muted"}`}>
                    {CALLS[l.call].label}
                  </span>
                  <span className="num w-14 text-right">{l.variant ? plat(l.variant[2]) : "—"}</span>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
      <Link href="/stash" className="btn mt-2 w-full">
        Open my stash
      </Link>
    </>
  );
}
