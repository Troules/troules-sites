"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { lastDays, type DayPoint } from "@/lib/variants";

const RANGES = [90, 30, 7] as const;
const PLOT = 200; // px height of the price area; the volume bars sit in the 80px under it

const dayLabel = (iso: string, weekday = false) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    ...(weekday ? { weekday: "short" } : {}),
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/**
 * Price history you can read day by day: hover, drag a finger, or focus the chart and use the arrow keys, and the
 * line above it names that day's median, range and trade count. The SVG is hand-rolled (no chart library in the
 * bundle) and stretches with its container; the crosshair is HTML laid over it, so it stays round at any width.
 */
export function PriceExplorer({
  days,
  asOf,
  label,
  median7,
}: {
  /** Up to 90 days with completed trades, oldest first. */
  days: DayPoint[];
  asOf: string;
  label: string;
  /** The 7-day median the rest of the page quotes, drawn as a dashed reference line. */
  median7: number | null;
}) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(90);
  const [picked, setPicked] = useState<number | null>(null);
  const shown = lastDays(days, asOf, range);
  const n = shown.length;

  const pick = (
    <div role="group" aria-label="Period" className="border-line bg-bg inline-flex gap-1 rounded-[10px] border p-[3px]">
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={r === range}
          onClick={() => {
            setRange(r);
            setPicked(null);
          }}
          className={`num min-h-8 cursor-pointer rounded-[7px] px-3 text-[13px] font-medium ${
            r === range ? "bg-chip text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {r} days
        </button>
      ))}
    </div>
  );

  if (n < 2)
    return (
      <>
        {pick}
        <p className="text-muted py-16 text-center text-sm">Not enough trades in this period.</p>
      </>
    );

  const lo = Math.min(...shown.map((d) => d.min));
  const hi = Math.max(...shown.map((d) => d.max));
  const pad = (hi - lo) * 0.08 || 1;
  const yLo = Math.max(0, Math.floor(lo - pad));
  const yHi = Math.ceil(hi + pad);
  const yOf = (v: number) => 2 + ((yHi - v) / (yHi - yLo)) * (PLOT - 4);
  const xOf = (i: number) => (i * 1000) / (n - 1);
  const vmax = Math.max(...shown.map((d) => d.volume));
  const line = shown.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.median).toFixed(1)}`).join(" ");
  const band = [
    ...shown.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.max).toFixed(1)}`),
    ...shown.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.min).toFixed(1)}`).reverse(),
  ].join(" ");
  const bars = shown.map((d, i) => `M${xOf(i).toFixed(1)} 278V${(278 - (d.volume / vmax) * 64).toFixed(1)}`).join("");
  const first = shown[0]!;
  const last = shown[n - 1]!;
  const at = picked == null ? null : Math.min(picked, n - 1);
  const day = shown[at ?? n - 1]!;
  const refY = median7 != null && median7 >= yLo && median7 <= yHi ? yOf(median7) : null;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - box.left) / box.width) * (n - 1));
    setPicked(Math.max(0, Math.min(n - 1, i)));
  };
  const onKey = (e: KeyboardEvent) => {
    const from = at ?? n - 1;
    const to = { ArrowLeft: from - 1, ArrowRight: from + 1, Home: 0, End: n - 1 }[e.key];
    if (e.key === "Escape") return setPicked(null);
    if (to === undefined) return;
    e.preventDefault();
    setPicked(Math.max(0, Math.min(n - 1, to)));
  };

  return (
    <figure className="m-0">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        {pick}
        <p aria-live="polite" className="num text-[13px]">
          <span className="text-muted">{dayLabel(day.day, true)}</span>
          <span className="ml-2.5 font-medium">{day.median}p</span>
          <span className="text-muted ml-2.5">
            {day.min}–{day.max}p, {day.volume} {day.volume === 1 ? "trade" : "trades"}
          </span>
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <div
          aria-hidden="true"
          className="num text-muted flex min-w-9 flex-col justify-between text-right text-[11px]"
          style={{ height: PLOT }}
        >
          <span>{yHi}p</span>
          <span>{Math.round((yHi + yLo) / 2)}p</span>
          <span>{yLo}p</span>
        </div>
        <div className="min-w-0 flex-1">
          <div
            role="group"
            tabIndex={0}
            aria-label="Price chart. Use the left and right arrow keys to read it day by day."
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setPicked(null)}
            onKeyDown={onKey}
            className="relative touch-pan-y rounded-sm"
          >
            <svg
              width="100%"
              height="280"
              viewBox="0 0 1000 280"
              preserveAspectRatio="none"
              role="img"
              aria-label={`${label}, last ${range} days: median from ${first.median}p on ${first.day} to ${last.median}p on ${last.day}, daily range ${lo}–${hi}p, up to ${vmax} trades a day`}
              className="block"
            >
              {[2, PLOT / 2, PLOT - 2].map((gy) => (
                <line
                  key={gy}
                  x1="0"
                  x2="1000"
                  y1={gy}
                  y2={gy}
                  stroke="var(--color-line)"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <polygon points={band} fill="rgb(143 211 255 / 0.12)" />
              {refY != null && (
                <line
                  x1="0"
                  x2="1000"
                  y1={refY}
                  y2={refY}
                  stroke="var(--color-muted)"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <polyline
                points={line}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <path d={bars} stroke="#46506a" strokeWidth={Math.max(2, Math.floor((1000 / n) * 0.6))} />
            </svg>
            {at != null && (
              <>
                <span
                  aria-hidden="true"
                  className="bg-muted/60 pointer-events-none absolute top-0 bottom-0 w-px"
                  style={{ left: `${(at / (n - 1)) * 100}%` }}
                />
                <span
                  aria-hidden="true"
                  className="border-bg bg-accent pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                  style={{ left: `${(at / (n - 1)) * 100}%`, top: yOf(day.median) }}
                />
              </>
            )}
          </div>
          <div aria-hidden="true" className="num text-muted mt-1.5 flex justify-between text-[11px]">
            <span>{dayLabel(first.day)}</span>
            <span>trades, up to {vmax} a day</span>
            <span>{dayLabel(last.day)}</span>
          </div>
        </div>
      </div>
      <figcaption className="text-muted mt-2 text-xs">
        Line: daily median. Band: lowest to highest sale. Bars: completed trades.
        {refY != null ? " Dashed: the 7-day median." : ""}
      </figcaption>
    </figure>
  );
}
