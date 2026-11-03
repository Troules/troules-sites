/**
 * Hand-rolled, server-rendered SVG charts: no chart library in the bundle (Lighthouse perf ≥ 90), and the lines
 * keep a constant width at any size thanks to vector-effect="non-scaling-stroke".
 */

export function Sparkline({ values, label }: { values: (number | null)[]; label: string }) {
  const pts = values.flatMap((v, i) => (v == null ? [] : [[i, v] as const]));
  if (pts.length < 2) return <span className="text-muted text-xs">not enough trades</span>;
  const ys = pts.map(([, v]) => v);
  const lo = Math.min(...ys);
  const span = Math.max(...ys) - lo || 1;
  const step = 96 / (values.length - 1);
  const points = pts.map(([i, v]) => `${(i * step).toFixed(1)},${(21 - ((v - lo) / span) * 18).toFixed(1)}`).join(" ");
  return (
    <svg width="96" height="24" viewBox="0 0 96 24" role="img" aria-label={label} className="inline-block">
      <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/** One chart point: a calendar day with completed trades. */
export type ChartDay = { day: string; volume: number; min: number; max: number; median: number };

export function PriceChart({ days, label }: { days: ChartDay[]; label: string }) {
  if (days.length < 2) return <p className="text-muted py-16 text-center text-sm">Not enough trades in this period.</p>;
  const n = days.length;
  const lo = Math.min(...days.map((d) => d.min));
  const hi = Math.max(...days.map((d) => d.max));
  const pad = (hi - lo) * 0.08 || 1;
  const yLo = Math.max(0, Math.floor(lo - pad));
  const yHi = Math.ceil(hi + pad);
  const y = (v: number) => (2 + ((yHi - v) / (yHi - yLo)) * 196).toFixed(1);
  const x = (i: number) => ((i * 1000) / (n - 1)).toFixed(1);
  const vmax = Math.max(...days.map((d) => d.volume));
  const line = days.map((d, i) => `${x(i)},${y(d.median)}`).join(" ");
  const band = [
    ...days.map((d, i) => `${x(i)},${y(d.max)}`),
    ...days.map((d, i) => `${x(i)},${y(d.min)}`).reverse(),
  ].join(" ");
  const bars = days.map((d, i) => `M${x(i)} 278V${(278 - (d.volume / vmax) * 64).toFixed(1)}`).join("");
  const first = days[0]!;
  const last = days[n - 1]!;

  return (
    <figure className="m-0">
      <div className="flex gap-2">
        <div
          aria-hidden="true"
          className="num text-muted flex h-[200px] min-w-9 flex-col justify-between text-right text-[11px]"
        >
          <span>{yHi}p</span>
          <span>{Math.round((yHi + yLo) / 2)}p</span>
          <span>{yLo}p</span>
        </div>
        <div className="min-w-0 flex-1">
          <svg
            width="100%"
            height="280"
            viewBox="0 0 1000 280"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${label}: median from ${first.median}p on ${first.day} to ${last.median}p on ${last.day}, daily range ${lo}–${hi}p, up to ${vmax} trades a day`}
            className="block"
          >
            {[2, 100, 198].map((gy) => (
              <line key={gy} x1="0" x2="1000" y1={gy} y2={gy} stroke="#1f2531" vectorEffect="non-scaling-stroke" />
            ))}
            <polygon points={band} fill="rgb(143 211 255 / 0.12)" />
            <polyline
              points={line}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path d={bars} stroke="#4a5568" strokeWidth={Math.max(2, Math.floor((1000 / n) * 0.6))} />
          </svg>
          <div aria-hidden="true" className="num text-muted mt-1.5 flex justify-between text-[11px]">
            <span>{first.day.slice(5)}</span>
            <span>volume, max {vmax}/day</span>
            <span>{last.day.slice(5)}</span>
          </div>
        </div>
      </div>
      <figcaption className="text-muted mt-2 text-xs">
        Line: daily median. Band: lowest to highest sale. Bars: completed trades.
      </figcaption>
    </figure>
  );
}
