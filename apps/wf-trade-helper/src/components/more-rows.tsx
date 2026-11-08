"use client";

import { useEffect, useRef, useState } from "react";
import { COLUMN_COUNT, TopRow } from "@/components/top-row";
import type { Sort } from "@/lib/rank";
import type { Row } from "@/lib/types";

const STEP = 10;

/**
 * Ranks 11–100 of one top list. Nothing is fetched until the end of the table nears the viewport; then the
 * static /top/<sort> JSON (built with the site, no function call) comes in once and is revealed 10 rows at a time
 * as the reader keeps scrolling. The button does the same for keyboard and screen-reader users, and an inactive
 * tab's panel is hidden, so its observer never fires.
 */
export function MoreRows({ sort, first, total }: { sort: Sort; first: number; total: number }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [shown, setShown] = useState(0);
  const [failed, setFailed] = useState(false);
  const loading = useRef(false);
  const sentinel = useRef<HTMLTableRowElement>(null);
  const done = first + shown >= total;

  async function more() {
    if (rows) return setShown((s) => Math.min(rows.length, s + STEP));
    if (loading.current) return;
    loading.current = true;
    try {
      const res = await fetch(`/top/${sort}`);
      if (!res.ok) throw new Error(String(res.status));
      setRows((await res.json()) as Row[]);
      setShown(STEP);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      loading.current = false;
    }
  }

  // Re-observe after every reveal: if the sentinel is still on screen (tall window), the fresh observer's first
  // callback loads the next batch; otherwise it waits for the reader to scroll.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || done || failed) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && void more(), {
      rootMargin: "200px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  });

  return (
    <tbody>
      {rows?.slice(0, shown).map((r, i) => (
        <TopRow key={`${r.slug}-${r.rank}-${r.subtype}`} row={r} n={first + i + 1} sort={sort} />
      ))}
      {!done && (
        <tr ref={sentinel} className="border-line border-t">
          <td colSpan={COLUMN_COUNT} className="px-[18px] py-2.5 text-center">
            <button
              type="button"
              onClick={() => void more()}
              className="text-accent min-h-9 cursor-pointer rounded-[7px] px-3 text-[13px] underline underline-offset-2"
            >
              {failed ? "Couldn't load more. Try again" : `Show ${Math.min(STEP, total - first - shown)} more`}
            </button>
            <span className="sr-only" aria-live="polite">
              {shown ? `Showing ${first + shown} of ${total}` : ""}
            </span>
          </td>
        </tr>
      )}
    </tbody>
  );
}
