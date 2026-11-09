"use client";

import Link from "next/link";
import { useDeferredValue, useId, useState, type ReactNode } from "react";
import { compact, pct, plat } from "@/lib/format";
import {
  atLeastOne,
  copyValue,
  dissolves,
  packsFor,
  packsFrom,
  simulate,
  valueCollections,
  type CollectionValue,
  type Price,
  type Strategy,
} from "@/lib/vosfor";
import { COLLECTIONS, PACK_COST, PACK_CREDITS, PULLS_PER_PACK } from "@/lib/vosfor-data";
import { ItemIcon } from "./item-icon";

const MAX_VOSFOR = 200_000;
const STRATEGIES: { id: Strategy; label: string; hint: string }[] = [
  { id: "recycle", label: "Sell or dissolve", hint: "dissolve copies worth more as Vosfor, buy more packs" },
  { id: "sell", label: "Sell everything", hint: "every copy sold at its rank-0 median" },
];

/** Small expected values keep one decimal, so a 0.4p share does not read as nothing. */
const fine = (n: number) => (n > 0 && n < 10 ? `${n.toFixed(1)}p` : plat(n));

const perPack = (v: CollectionValue, s: Strategy) => (s === "recycle" ? v.recyclePack : v.sellPack);

/**
 * Interactive part of /vosfor. Everything runs in the browser from the prices the server rendered in: the
 * simulation is seeded, so the prerendered HTML and the hydrated page show the same numbers.
 */
export function VosforCalculator({ prices }: { prices: Price[] }) {
  const [input, setInput] = useState("1000");
  const [strategy, setStrategy] = useState<Strategy>("recycle");
  const [picked, setPicked] = useState<string | null>(null);
  const id = useId();

  const values = valueCollections(COLLECTIONS, new Map(prices.map((p) => [p.slug, p])));
  const ranked = [...values].sort((a, b) => perPack(b, strategy) - perPack(a, strategy));
  const best = ranked[0]!;
  const current = values.find((v) => v.id === picked) ?? best;

  const parsed = Math.floor(Number(input));
  const vosfor = Number.isFinite(parsed) ? Math.min(MAX_VOSFOR, Math.max(0, parsed)) : 0;
  const deferred = useDeferredValue(vosfor);
  const packs = packsFrom(vosfor);

  return (
    <>
      <section
        aria-label="Your Vosfor"
        className="border-line bg-panel flex flex-wrap items-end gap-x-8 gap-y-4 rounded-[14px] border p-[18px]"
      >
        <div>
          <label htmlFor={`${id}-vosfor`} className="text-muted block text-xs">
            Vosfor you have
          </label>
          <input
            id={`${id}-vosfor`}
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_VOSFOR}
            step={PACK_COST}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-describedby={`${id}-packs`}
            className="num border-line-strong bg-bg mt-1 w-40 rounded-lg border px-3 py-2 text-base"
          />
          <p id={`${id}-packs`} className="num text-muted mt-1 text-xs">
            = {packs} pack{packs === 1 ? "" : "s"} · {compact(packs * PACK_CREDITS)} credits
            {vosfor === MAX_VOSFOR ? ` (capped at ${MAX_VOSFOR.toLocaleString("en-US")})` : ""}
          </p>
        </div>
        <fieldset>
          <legend className="text-muted text-xs">What you do with the arcanes</legend>
          <div className="border-line bg-bg mt-1 inline-flex flex-wrap gap-1 rounded-[10px] border p-[3px]">
            {STRATEGIES.map((s) => (
              <label
                key={s.id}
                className={`flex min-h-9 cursor-pointer items-center rounded-[7px] px-3 text-[13px] font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-accent)] ${
                  strategy === s.id ? "bg-chip text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-strategy`}
                  value={s.id}
                  checked={strategy === s.id}
                  onChange={() => setStrategy(s.id)}
                  className="sr-only"
                />
                {s.label}
              </label>
            ))}
          </div>
          <p className="text-muted mt-1 text-xs">{STRATEGIES.find((s) => s.id === strategy)!.hint}.</p>
        </fieldset>
        <div className="ml-auto text-right">
          <div className="text-muted text-xs">Best collection</div>
          <div className="mt-0.5 text-lg font-semibold">{best.name}</div>
          <div className="num text-accent">{plat(perPack(best, strategy))} per pack</div>
        </div>
      </section>

      <Ranking ranked={ranked} strategy={strategy} current={current.id} vosfor={vosfor} onPick={setPicked} />
      <Details value={current} strategy={strategy} vosfor={deferred} />
    </>
  );
}

function Ranking({
  ranked,
  strategy,
  current,
  vosfor,
  onPick,
}: {
  ranked: CollectionValue[];
  strategy: Strategy;
  current: string;
  vosfor: number;
  onPick: (id: string) => void;
}) {
  const packs = packsFrom(vosfor);
  return (
    <section aria-labelledby="collections" className="border-line bg-panel min-w-0 rounded-[14px] border">
      <div className="px-[18px] pt-4">
        <h2 id="collections" className="text-base font-semibold">
          Collections by expected plat
        </h2>
        <p className="text-muted mt-1 text-xs">Pick one to see its arcanes, odds and a simulation of your Vosfor.</p>
      </div>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <caption className="sr-only">Arcane Collections by expected plat per pack, best first</caption>
          <thead>
            <tr className="text-muted text-right text-xs">
              <th scope="col" className="py-2 pr-2.5 pl-[18px] text-left font-medium">
                Collection
              </th>
              <SortableHead active={strategy === "sell"}>Sell all / pack</SortableHead>
              <SortableHead active={strategy === "recycle"}>Sell or dissolve / pack</SortableHead>
              <th scope="col" className="px-2.5 py-2 font-medium">
                Your Vosfor, about
              </th>
              <th scope="col" className="px-2.5 py-2 font-medium">
                Legendary / pack
              </th>
              <th scope="col" className="py-2 pr-[18px] pl-2.5 font-medium">
                Priced
              </th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((v, i) => {
              const total = strategy === "recycle" ? vosfor * v.lambda : packs * v.sellPack;
              const selected = v.id === current;
              return (
                <tr key={v.id} className={`border-line border-t ${selected ? "bg-raised" : "hover:bg-[#161a23]"}`}>
                  <td className="py-2 pr-2.5 pl-[18px]">
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onPick(v.id)}
                      className="hover:text-accent flex cursor-pointer items-center gap-2 text-left font-medium"
                    >
                      <span className="num text-muted w-4 text-xs">{i + 1}</span>
                      {v.name}
                      {i === 0 && (
                        <span className="bg-chip text-accent rounded-full px-2 py-0.5 text-[11px] font-normal">
                          best
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="num p-2.5 text-right">{fine(v.sellPack)}</td>
                  <td className="num p-2.5 text-right">{fine(v.recyclePack)}</td>
                  <td className="num p-2.5 text-right font-medium">{plat(total)}</td>
                  <td className="num p-2.5 text-right">{pct(v.legendary)}</td>
                  <td className="num text-muted py-2 pr-[18px] pl-2.5 text-right">
                    {v.priced}/{v.drops.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SortableHead({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <th
      scope="col"
      aria-sort={active ? "descending" : undefined}
      className={`px-2.5 py-2 font-medium ${active ? "text-ink" : ""}`}
    >
      {children}
      {active ? " ↓" : ""}
    </th>
  );
}

function Details({ value, strategy, vosfor }: { value: CollectionValue; strategy: Strategy; vosfor: number }) {
  const lambda = strategy === "recycle" ? value.lambda : 0;
  const out = simulate(value.drops, vosfor, strategy, value.lambda);
  const packs = Math.round(out.packs);
  // Copies to sell first, then the ones to dissolve; each group by its share of a pack's value.
  const rows = [...value.drops].sort(
    (a, b) =>
      Number(dissolves(a, lambda)) - Number(dissolves(b, lambda)) ||
      b.chance * copyValue(b, lambda) - a.chance * copyValue(a, lambda),
  );
  const toSell = rows.filter((d) => !dissolves(d, lambda));

  return (
    <section aria-labelledby="details" className="border-line bg-panel min-w-0 rounded-[14px] border">
      <div className="px-[18px] pt-4">
        <h2 id="details" className="text-base font-semibold">
          {value.name} Arcane Collection
        </h2>
        <p className="text-muted mt-1 text-xs leading-normal">
          {strategy === "recycle" ? (
            <>
              One Vosfor is worth <span className="num text-ink">{lambda.toFixed(2)}p</span> here: dissolve a copy when
              its rank-0 price is below its Vosfor × {lambda.toFixed(2)}.
            </>
          ) : (
            <>Every copy is sold at its rank-0 median; nothing is dissolved.</>
          )}
        </p>
      </div>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 px-[18px] pt-4">
        <Stat label={strategy === "recycle" ? "Packs opened, incl. recycled" : "Packs opened"}>
          {compact(out.packs)}
        </Stat>
        <Stat label="Expected plat">{plat(out.mean)}</Stat>
        <Stat label="Likely range (10–90%)">
          {plat(out.p10)}–{plat(out.p90)}
        </Stat>
        <Stat label="At least one Legendary">{pct(out.legendary)}</Stat>
      </dl>
      <p className="text-muted px-[18px] pt-2 text-[11px]">
        {out.runs.toLocaleString("en-US")} simulated runs of {vosfor.toLocaleString("en-US")} Vosfor, median{" "}
        {plat(out.p50)}.
      </p>

      {strategy === "recycle" && (
        <div className="border-accent/40 bg-accent/5 mx-[18px] mt-4 rounded-xl border px-4 py-3">
          <h3 className="text-accent text-[13px] font-semibold">
            Sell these · {toSell.length} of {rows.length}
          </h3>
          {toSell.length ? (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Arcanes to sell">
              {toSell.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/items/${d.slug}`}
                    className="bg-accent/15 text-accent hover:bg-accent/25 inline-flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-xs font-medium"
                  >
                    <ItemIcon name={d.name} thumb={d.thumb} size={20} />
                    {d.name}
                    <span className="num text-ink font-normal">{d.price != null ? plat(d.price) : ""}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mt-1 text-xs">None: every copy is worth more as Vosfor.</p>
          )}
          <p className="text-muted mt-2 text-xs">Dissolve everything else at Loid.</p>
        </div>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <caption className="sr-only">
            Arcanes in the {value.name} collection, by expected plat per pull, with drop chances
          </caption>
          <thead>
            <tr className="text-muted text-right text-xs">
              <th scope="col" className="py-2 pr-2.5 pl-[18px] text-left font-medium">
                Arcane
              </th>
              <th scope="col" className="px-2.5 py-2 font-medium">
                Per pull
              </th>
              <th scope="col" className="px-2.5 py-2 font-medium">
                ≥1 per pack
              </th>
              <th scope="col" className="px-2.5 py-2 font-medium">
                ≥1 in {packs} pack{packs === 1 ? "" : "s"}
              </th>
              <th scope="col" className="px-2.5 py-2 font-medium">
                Packs for 90%
              </th>
              <th scope="col" className="px-2.5 py-2 font-medium">
                Rank 0 · trades/day
              </th>
              <th scope="col" className="px-2.5 py-2 font-medium">
                Vosfor
              </th>
              <th scope="col" className="px-2.5 py-2 text-left font-medium">
                Do
              </th>
              <th scope="col" aria-sort="descending" className="text-ink py-2 pr-[18px] pl-2.5 font-medium">
                Plat / pack ↓
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const dissolve = dissolves(d, lambda);
              return (
                <tr
                  key={d.slug}
                  className={`border-line border-t ${dissolve ? "hover:bg-[#161a23]" : "bg-accent/[0.06] hover:bg-accent/10"}`}
                >
                  <td
                    className={`py-2 pr-2.5 pl-[18px] ${dissolve ? "" : "shadow-[inset_3px_0_0_var(--color-accent)]"}`}
                  >
                    <Link href={`/items/${d.slug}`} className="hover:text-accent flex items-center gap-2.5">
                      <ItemIcon name={d.name} thumb={d.thumb} size={28} />
                      <span className="flex flex-col">
                        <span className="font-medium">{d.name}</span>
                        <span className={`text-xs ${d.rarity === "Legendary" ? "text-accent" : "text-muted"}`}>
                          {d.rarity}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="num p-2.5 text-right">{pct(d.chance)}</td>
                  <td className="num p-2.5 text-right">{pct(atLeastOne(d.chance))}</td>
                  <td className="num p-2.5 text-right">{packs ? pct(atLeastOne(d.chance, packs)) : "–"}</td>
                  <td className="num p-2.5 text-right">{packsFor(d.chance, 0.9).toLocaleString("en-US")}</td>
                  <td className="num p-2.5 text-right">
                    {d.price == null ? (
                      <span className="text-muted">no trades</span>
                    ) : (
                      <>
                        {plat(d.price)}
                        <span className={`block text-[11px] ${d.vol < 1 ? "text-down" : "text-muted"}`}>
                          {d.vol < 1 ? "thin · " : ""}
                          {compact(d.vol)}/day
                        </span>
                      </>
                    )}
                  </td>
                  <td className="num p-2.5 text-right">{d.yield}</td>
                  <td className="p-2.5 text-left">
                    {dissolve ? (
                      <span className="text-muted">Dissolve</span>
                    ) : (
                      <span className="bg-accent text-bg rounded-full px-2.5 py-0.5 text-xs font-semibold">Sell</span>
                    )}
                  </td>
                  <td className="num py-2 pr-[18px] pl-2.5 text-right font-medium">
                    {fine(PULLS_PER_PACK * d.chance * copyValue(d, lambda))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-line text-muted mt-1 border-t px-[18px] pt-3 pb-4 text-xs">
        Per pull: chance this arcane fills one of the {PULLS_PER_PACK} slots. Plat / pack: its share of a pack&apos;s
        expected value{strategy === "recycle" ? ", dissolved copies counted at their Vosfor's worth" : ""}.
      </p>
    </section>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-line bg-bg rounded-xl border px-4 py-3">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="num mt-1 text-lg">{children}</dd>
    </div>
  );
}
