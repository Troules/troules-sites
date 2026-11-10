"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { COLUMN_COUNT, TopHead, TopRow } from "@/components/top-row";
import { FIRST_ROWS, KINDS, SORTS, type KindId, type Sort } from "@/lib/rank";
import type { Row } from "@/lib/types";

const STEP = 10;

type List = { rows: Row[]; complete: boolean };
const keyOf = (sort: Sort, kind: KindId) => `${sort}|${kind}`;

/**
 * The dashboard's top list: five sorts (ARIA tabs) crossed with an item-type filter.
 *
 * The first 10 rows of every unfiltered sort arrive with the page, so the default view is in the static HTML and
 * switching sort is instant. Everything else is static JSON built with the site, fetched once when it is first
 * needed: ranks 11–100 (/top/<sort>) as the end of the table nears the viewport, and a type's whole list
 * (/top/<sort>/<kind>) when the reader picks that type. Rows are revealed 10 at a time; the button does the same
 * for keyboard and screen-reader users.
 */
export function TopBoard({
  first,
  totals,
  limit,
}: {
  first: Record<Sort, Row[]>;
  /** Length of each unfiltered list, to know whether ranks 11+ exist before fetching them. */
  totals: Record<Sort, number>;
  limit: number;
}) {
  const [sort, setSort] = useState<Sort>("plat");
  const [kind, setKind] = useState<KindId>("all");
  const [shown, setShown] = useState(FIRST_ROWS);
  const [lists, setLists] = useState<Record<string, List>>(() =>
    Object.fromEntries(
      SORTS.map((s) => [keyOf(s.id, "all"), { rows: first[s.id], complete: first[s.id].length >= totals[s.id] }]),
    ),
  );
  const [failed, setFailed] = useState<string | null>(null);
  const pending = useRef(new Set<string>());
  /** The view on screen, for fetches that resolve after the reader has moved on to another one. */
  const view = useRef(keyOf("plat", "all"));
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const sentinel = useRef<HTMLTableRowElement>(null);
  const base = useId();

  const key = keyOf(sort, kind);
  const list = lists[key];
  const total = kind === "all" ? totals[sort] : (list?.rows.length ?? 0);
  const visible = list?.rows.slice(0, shown) ?? [];
  const done = !!list && visible.length >= total;
  const meta = SORTS.find((s) => s.id === sort)!;
  const kindLabel = KINDS.find((k) => k.id === kind)!.label.toLowerCase();

  /** Fetches the rest of a list once; resolves to whether the list is now complete. */
  async function load(s: Sort, k: KindId): Promise<boolean> {
    const id = keyOf(s, k);
    if (lists[id]?.complete) return true;
    if (pending.current.has(id)) return false;
    pending.current.add(id);
    try {
      const res = await fetch(k === "all" ? `/top/${s}` : `/top/${s}/${k}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Row[];
      setLists((prev) => ({ ...prev, [id]: { rows: k === "all" ? [...first[s], ...data] : data, complete: true } }));
      setFailed((f) => (f === id ? null : f));
      return true;
    } catch {
      setFailed(id);
      return false;
    } finally {
      pending.current.delete(id);
    }
  }

  function show(s: Sort, k: KindId) {
    view.current = keyOf(s, k);
    setSort(s);
    setKind(k);
    setShown(FIRST_ROWS);
    if (k !== "all") void load(s, k);
  }

  async function more() {
    if ((await load(sort, kind)) && view.current === key) setShown((n) => n + STEP);
  }

  // Re-observe after every reveal: if the sentinel is still on screen (tall window), the fresh observer's first
  // callback loads the next batch; otherwise it waits for the reader to scroll.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || done || failed === key) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && void more(), {
      rootMargin: "200px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  });

  const onTabKey = (e: KeyboardEvent, i: number) => {
    const last = SORTS.length - 1;
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    show(SORTS[next]!.id, kind);
    tabs.current[next]?.focus();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 px-[18px] pt-3">
        <div
          role="tablist"
          aria-label={`Sort the top ${limit} by`}
          className="border-line bg-bg inline-flex w-fit max-w-full flex-wrap gap-1 rounded-[10px] border p-[3px]"
        >
          {SORTS.map((s, i) => {
            const selected = s.id === sort;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${base}-tab-${s.id}`}
                aria-selected={selected}
                aria-controls={`${base}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => show(s.id, kind)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={`min-h-9 cursor-pointer rounded-[7px] px-3 text-[13px] font-medium ${
                  selected ? "bg-chip text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div role="group" aria-label="Item type" className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => {
            const on = k.id === kind;
            return (
              <button
                key={k.id}
                type="button"
                aria-pressed={on}
                onClick={() => show(sort, k.id)}
                className={`min-h-8 cursor-pointer rounded-full border px-3 text-[13px] ${
                  on
                    ? "border-accent text-accent bg-[rgb(143_211_255/0.1)] font-medium"
                    : "border-line-strong text-muted hover:text-ink"
                }`}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${sort}`}>
        <p className="text-muted px-[18px] pt-2.5 pb-1 text-xs">{meta.hint}.</p>
        <div className="@container">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              Top {kind === "all" ? "items" : kindLabel} by {meta.label.toLowerCase()}, {visible.length} of {total}{" "}
              shown, more as you scroll
            </caption>
            <TopHead sort={sort} />
            <tbody>
              {visible.map((r, i) => (
                <TopRow key={`${r.slug}-${r.rank}-${r.subtype}`} row={r} n={i + 1} sort={sort} />
              ))}
              {list && total === 0 && (
                <tr className="border-line border-t">
                  <td colSpan={COLUMN_COUNT} className="text-muted px-[18px] py-8 text-center">
                    No {kindLabel} traded often enough to rank here. Try another sort or type.
                  </td>
                </tr>
              )}
              {!done && (
                <tr ref={sentinel} className="border-line border-t">
                  <td colSpan={COLUMN_COUNT} className="px-[18px] py-2.5 text-center">
                    {failed === key ? (
                      <button
                        type="button"
                        onClick={() => void more()}
                        className="link min-h-9 cursor-pointer px-3 text-[13px]"
                      >
                        Couldn&apos;t load the list. Try again
                      </button>
                    ) : list ? (
                      <button
                        type="button"
                        onClick={() => void more()}
                        className="link min-h-9 cursor-pointer px-3 text-[13px]"
                      >
                        Show {Math.min(STEP, total - visible.length)} more
                      </button>
                    ) : (
                      <span className="text-muted text-[13px]">Loading {kindLabel}…</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="sr-only" aria-live="polite">
          {list && (shown > FIRST_ROWS || kind !== "all") ? `Showing ${visible.length} of ${total}` : ""}
        </p>
      </div>
    </>
  );
}
