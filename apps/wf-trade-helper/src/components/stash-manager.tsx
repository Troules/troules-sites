"use client";

import Link from "next/link";
import { useId, useState, type KeyboardEvent } from "react";
import { plat, trendText } from "@/lib/format";
import { search, type IndexEntry } from "@/lib/search";
import {
  addEntry,
  CALLS,
  chatMessages,
  entryKey,
  MAX_ENTRIES,
  MAX_QTY,
  removeEntry,
  setQty,
  setVariant,
  stashLines,
  type Call,
  type PriceVariant,
  type StashLine,
} from "@/lib/stash";
import { CopyButton } from "./copy-button";
import { ItemIcon } from "./item-icon";
import { useStashData, type StashData } from "./stash-data";
import { updateStash, useStash } from "./stash-store";

export type Suggestion = { slug: string; name: string; thumb: string | null };

const variantName = (rank: number | null, subtype: string | null) =>
  [rank != null ? `Rank ${rank}` : "", subtype ? subtype[0]!.toUpperCase() + subtype.slice(1) : ""]
    .filter(Boolean)
    .join(", ") || "Unranked";

const TONE: Record<Call, string> = {
  sell: "border-up/60 text-up bg-up/10 font-medium",
  falling: "border-down/60 text-down bg-down/10",
  fair: "border-line-strong text-ink",
  hold: "border-line-strong text-muted",
  thin: "border-line-strong text-muted",
  none: "border-line-strong text-muted",
};

/**
 * The stash page: add items, set how many you hold and at which rank, and read what to list today. Everything
 * happens in the browser; the list is ordered by what to do (sell first, hold last) and then by unit price, so a
 * row never jumps while you change its quantity.
 */
export function StashManager({ suggestions }: { suggestions: Suggestion[] }) {
  const stash = useStash();
  const { data, failed, retry } = useStashData(true);
  const [added, setAdded] = useState<string | null>(null);
  const [onlySell, setOnlySell] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const add = (slug: string, name: string) => {
    const [rank, subtype] = data?.prices[slug]?.[0] ?? [null, null];
    const entry = { slug, rank, subtype };
    updateStash((list) => addEntry(list, entry));
    setAdded(`${entryKey(entry)}#${name}`);
  };

  const lines = stash && data ? order(stashLines(stash, data.prices)) : [];
  const total = lines.reduce((a, l) => a + l.value, 0);
  const copies = stash?.reduce((a, e) => a + e.qty, 0) ?? 0;
  const selling = lines.filter((l) => l.call === "sell");
  const chat = chatMessages(
    "WTS",
    lines
      .filter((l) => l.variant && (!onlySell || l.call === "sell"))
      .map((l) => ({
        name: data!.bySlug.get(l.slug)?.[1] ?? l.slug,
        rank: l.rank,
        subtype: l.subtype,
        price: l.variant![2],
      })),
  );
  const addedKey = added?.split("#")[0];

  return (
    <>
      <section aria-label="Add an item" className="panel p-[18px]">
        <AddItem data={data} failed={failed} retry={retry} onAdd={add} full={(stash?.length ?? 0) >= MAX_ENTRIES} />
        <p className="sr-only" aria-live="polite">
          {added ? `Added ${added.split("#")[1]} to your stash` : ""}
        </p>
        {stash?.length === 0 && (
          <div className="mt-4">
            <p className="text-muted text-[13px]">Or start with something that sells a lot right now:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li key={s.slug}>
                  <button
                    type="button"
                    disabled={!data}
                    onClick={() => add(s.slug, s.name)}
                    className="border-line-strong hover:border-accent hover:text-accent flex min-h-10 cursor-pointer items-center gap-2 rounded-full border py-1 pr-3.5 pl-1.5 text-[13px] disabled:cursor-wait disabled:opacity-60"
                  >
                    <ItemIcon name={s.name} thumb={s.thumb} size={26} />
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {stash === null || (stash.length > 0 && !data) ? (
        <p className="text-muted py-10 text-center">
          {failed ? "Prices didn't load, so the stash can't be valued." : "Reading your stash…"}
        </p>
      ) : stash.length === 0 ? (
        <section className="border-line-strong rounded-[10px] border border-dashed px-6 py-10 text-center">
          <h2 className="text-xl font-semibold">Nothing in your stash yet</h2>
          <p className="text-muted mx-auto mt-2 max-w-[52ch] leading-relaxed">
            Search for what you farmed and want to sell: an arcane, a prime set, a mod. Each line then shows its 7-day
            median, where that sits in the last 90 days, and whether today is a good day to list it.
          </p>
        </section>
      ) : (
        <>
          <section aria-label="Stash summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Figure label="Worth today" hint="at the 7-day median">
              {plat(total)}
            </Figure>
            <Figure label="In the stash" hint={`${stash.length} ${stash.length === 1 ? "line" : "lines"}`}>
              {copies.toLocaleString("en-US")}
              <span className="text-muted text-[13px]"> {copies === 1 ? "item" : "items"}</span>
            </Figure>
            <Figure
              label="Near a 90-day high"
              hint={
                selling.length ? `${plat(selling.reduce((a, l) => a + l.value, 0))} to list today` : "nothing to rush"
              }
              className="max-sm:col-span-2"
            >
              <span className={selling.length ? "text-up" : ""}>{selling.length}</span>
            </Figure>
          </section>

          <section aria-labelledby="stash-lines" className="panel min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 px-[18px] pt-4 pb-2">
              <h2 id="stash-lines" className="text-lg font-semibold">
                What to sell first
              </h2>
              {confirming ? (
                <span className="flex items-center gap-2 text-[13px]">
                  Empty the whole stash?
                  <button
                    type="button"
                    className="btn min-h-9"
                    onClick={() => {
                      updateStash(() => []);
                      setConfirming(false);
                    }}
                  >
                    Yes, empty it
                  </button>
                  <button type="button" className="btn min-h-9" onClick={() => setConfirming(false)}>
                    Keep it
                  </button>
                </span>
              ) : (
                <button type="button" className="link cursor-pointer text-[13px]" onClick={() => setConfirming(true)}>
                  Empty the stash
                </button>
              )}
            </div>
            <div className="@container">
              <table className="w-full border-collapse">
                <caption className="sr-only">Your stash, what to sell first</caption>
                <thead>
                  <tr className="text-muted text-right text-xs whitespace-nowrap">
                    <th scope="col" className="py-2 pr-2 pl-[18px] text-left font-medium @max-[440px]:pl-3.5">
                      Item
                    </th>
                    <th scope="col" className="px-2 py-2 text-center font-medium">
                      Have
                    </th>
                    <th scope="col" className="px-2 py-2 font-medium @max-[560px]:hidden">
                      Median
                    </th>
                    <th scope="col" className="px-2 py-2 font-medium">
                      Worth
                    </th>
                    <th scope="col" className="px-2 py-2 font-medium @max-[820px]:hidden">
                      7d
                    </th>
                    <th scope="col" className="px-2 py-2 font-medium @max-[720px]:hidden">
                      vs 90d
                    </th>
                    <th scope="col" className="px-2 py-2 text-left font-medium @max-[440px]:hidden">
                      Today
                    </th>
                    <th scope="col" className="py-2 pr-[18px] pl-1">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <LineRow key={l.key} line={l} data={data!} fresh={l.key === addedKey} />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-line text-muted border-t px-[18px] pt-3 pb-4 text-xs leading-relaxed">
              Sell now: the 7-day median is higher than on 80% of the last 90 days. Hold: it is lower than on 80% of
              them. Falling: down 10% or more on the month before. Thin market: under one trade a day.
            </p>
          </section>

          <section aria-labelledby="chat" className="panel p-[18px]">
            <h2 id="chat" className="text-lg font-semibold">
              Trade-chat message
            </h2>
            <p className="text-muted mt-1 max-w-[76ch] text-[13px] leading-normal">
              Paste it in trade chat: the square brackets turn each name into an item link in game. Prices are the 7-day
              medians; long lists are cut into several messages.
            </p>
            <label className="mt-3 flex min-h-8 w-fit cursor-pointer items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={onlySell}
                onChange={(e) => setOnlySell(e.target.checked)}
                className="accent-accent size-4"
              />
              Only the items to sell now
            </label>
            {chat.length ? (
              <ol className="mt-2 flex flex-col gap-2">
                {chat.map((message, i) => (
                  <li key={i} className="flex flex-wrap items-start gap-2">
                    <p className="num bg-bg border-line min-w-0 flex-[1_1_320px] rounded-[7px] border px-3 py-2 text-[13px] leading-relaxed break-words">
                      {message}
                    </p>
                    <CopyButton
                      text={message}
                      label={chat.length > 1 ? `Copy message ${i + 1}` : "Copy message"}
                      copied="Copied"
                      className="btn min-w-[150px]"
                    />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted mt-2 text-[13px]">
                {onlySell
                  ? "Nothing in your stash is near its 90-day high today."
                  : "Nothing in your stash has a recent price."}
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}

/** What to do first, then the dearest unit price: stable while a quantity changes. */
function order(lines: StashLine[]): StashLine[] {
  return [...lines].sort(
    (a, b) =>
      CALLS[a.call].order - CALLS[b.call].order ||
      (b.variant?.[2] ?? 0) - (a.variant?.[2] ?? 0) ||
      a.key.localeCompare(b.key),
  );
}

function Figure({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`panel px-4 py-3.5 ${className}`}>
      <div className="text-muted text-xs">{label}</div>
      <div className="num mt-1 text-[26px] leading-tight font-medium">{children}</div>
      <div className="text-muted text-xs">{hint}</div>
    </div>
  );
}

function LineRow({ line: l, data, fresh }: { line: StashLine; data: StashData; fresh: boolean }) {
  const item = data.bySlug.get(l.slug);
  const name = item?.[1] ?? l.slug;
  const priced = data.prices[l.slug] ?? [];
  // The line's own variant stays selectable even when nobody traded it this week.
  const options: [number | null, string | null, boolean][] = [
    ...priced.map((v: PriceVariant): [number | null, string | null, boolean] => [v[0], v[1], true]),
    ...(l.variant ? [] : [[l.rank, l.subtype, false] as [number | null, string | null, boolean]]),
  ];
  const v = l.variant;
  const pos = v?.[5] == null ? null : Math.round(v[5] * 100);
  return (
    <tr className={`border-line border-t ${fresh ? "just-added" : ""}`}>
      <th scope="row" className="py-2.5 pr-2 pl-[18px] text-left font-normal @max-[440px]:pl-3.5">
        <span className="flex items-center gap-2.5">
          <span className="flex-none @max-[440px]:hidden">
            <ItemIcon name={name} thumb={item?.[2] ?? null} />
          </span>
          <span className="flex min-w-0 flex-col items-start">
            <Link href={`/items/${l.slug}`} className="hover:text-accent font-medium">
              {name}
            </Link>
            {options.length > 1 ? (
              <select
                aria-label={`Rank or type of ${name}`}
                value={`${l.rank}|${l.subtype}`}
                onChange={(e) => {
                  const o = options[e.target.selectedIndex]!;
                  updateStash((list) => setVariant(list, l.key, o[0], o[1]));
                }}
                className="text-muted bg-panel hover:text-ink -ml-1 max-w-full cursor-pointer rounded px-0.5 py-0.5 text-xs"
              >
                {options.map(([rank, subtype, traded]) => (
                  <option key={`${rank}|${subtype}`} value={`${rank}|${subtype}`}>
                    {variantName(rank, subtype)}
                    {traded ? "" : " (no trades)"}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-muted text-xs">{variantName(l.rank, l.subtype)}</span>
            )}
            <span
              className={`mt-1 hidden rounded-full border px-2 text-[11px] leading-5 @max-[440px]:inline-block ${TONE[l.call]}`}
            >
              {CALLS[l.call].label}
            </span>
          </span>
        </span>
      </th>
      <td className="px-2 py-2.5">
        <span className="border-line-strong mx-auto flex w-fit items-center rounded-[7px] border">
          <button
            type="button"
            aria-label={`One fewer ${name}`}
            disabled={l.qty <= 1}
            onClick={() => updateStash((list) => setQty(list, l.key, l.qty - 1))}
            className="hover:bg-chip grid h-8 w-8 cursor-pointer place-items-center rounded-l-[6px] disabled:cursor-default disabled:opacity-40 @max-[350px]:hidden"
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_QTY}
            aria-label={`How many ${name} you have`}
            value={l.qty}
            onChange={(e) => updateStash((list) => setQty(list, l.key, Number(e.target.value)))}
            onFocus={(e) => e.target.select()}
            className="num w-11 [appearance:textfield] bg-transparent text-center @max-[350px]:h-8 @max-[350px]:w-9 [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label={`One more ${name}`}
            onClick={() => updateStash((list) => setQty(list, l.key, l.qty + 1))}
            className="hover:bg-chip grid h-8 w-8 cursor-pointer place-items-center rounded-r-[6px] @max-[350px]:hidden"
          >
            +
          </button>
        </span>
      </td>
      <td className="num px-2 py-2.5 text-right @max-[560px]:hidden">{v ? plat(v[2]) : "—"}</td>
      <td className="num px-2 py-2.5 text-right font-medium">{v ? plat(l.value) : "—"}</td>
      <td className="num px-2 py-2.5 text-right whitespace-nowrap @max-[820px]:hidden">
        {v?.[4] == null ? (
          <span className="text-muted">—</span>
        ) : (
          <span className={v[4] >= 0 ? "text-up" : "text-down"}>{trendText(v[4])}</span>
        )}
      </td>
      <td className="num px-2 py-2.5 text-right @max-[720px]:hidden">
        {pos == null ? (
          <span className="text-muted">—</span>
        ) : (
          <span className={pos >= 80 ? "text-up" : pos <= 20 ? "text-down" : ""}>{pos}%</span>
        )}
      </td>
      <td className="px-2 py-2.5 @max-[440px]:hidden">
        <span className={`inline-block rounded-full border px-2.5 text-xs leading-6 whitespace-nowrap ${TONE[l.call]}`}>
          {CALLS[l.call].label}
        </span>
        <span className="text-muted mt-0.5 block max-w-[30ch] text-[11px] leading-snug @max-[980px]:hidden">
          {l.why}
        </span>
      </td>
      <td className="py-2.5 pr-[14px] pl-0 text-right @max-[440px]:pr-2">
        <button
          type="button"
          aria-label={`Remove ${name} from the stash`}
          onClick={() => updateStash((list) => removeEntry(list, l.key))}
          className="text-muted hover:text-down hover:bg-chip grid size-8 cursor-pointer place-items-center rounded-[6px]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

/** Type-ahead over the item list the ⌘K palette uses; Enter or a click adds the highlighted item. */
function AddItem({
  data,
  failed,
  retry,
  onAdd,
  full,
}: {
  data: StashData | null;
  failed: boolean;
  retry: () => void;
  onAdd: (slug: string, name: string) => void;
  full: boolean;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const id = useId();
  const hits = data && !full ? search(data.items, query, 6) : [];

  const choose = (entry: IndexEntry) => {
    onAdd(entry[0], entry[1]);
    setQuery("");
    setActive(0);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (hits.length) setActive((a) => (a + (e.key === "ArrowDown" ? 1 : hits.length - 1)) % hits.length);
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      choose(hits[active].entry);
    } else if (e.key === "Escape") setQuery("");
  };

  return (
    <div>
      <label htmlFor={`${id}-q`} className="text-lg font-semibold [font-stretch:80%]">
        Add an item you want to sell
      </label>
      <input
        id={`${id}-q`}
        type="search"
        role="combobox"
        aria-expanded={hits.length > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={hits[active] ? `${id}-${active}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={full}
        placeholder="Arcane Energize, Wisp Prime Set, Primed Continuity…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKey}
        className="field mt-2 block w-full max-w-[560px] text-base"
      />
      <p role="status" className="text-muted mt-1.5 text-xs">
        {full
          ? `A stash holds ${MAX_ENTRIES} lines. Remove one to add another.`
          : failed
            ? "The item list didn't load. "
            : !data
              ? "Loading the item list…"
              : query.trim() && !hits.length
                ? `No item matches “${query.trim()}”.`
                : "Saved in this browser only. No account, nothing sent."}
        {failed && !full ? (
          <button type="button" onClick={retry} className="link cursor-pointer">
            Try again
          </button>
        ) : null}
      </p>
      <ul id={`${id}-list`} role="listbox" aria-label="Matching items" className="mt-1 max-w-[560px]">
        {hits.map((h, i) => {
          const [slug, name, thumb, kind] = h.entry;
          return (
            <li
              key={slug}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              onClick={() => choose(h.entry)}
              onMouseMove={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-[8px] px-2.5 py-1.5 ${i === active ? "bg-chip" : ""}`}
            >
              <ItemIcon name={name} thumb={thumb} size={28} />
              <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
              <span className="text-muted text-xs">{kind}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
