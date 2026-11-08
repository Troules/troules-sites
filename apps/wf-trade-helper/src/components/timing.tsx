import { ProfileChart } from "@/components/charts";
import { REGIONS, WEEKDAYS, regionIndex, type Bucket } from "@/lib/signals";

const HOUR_TICKS = Array.from({ length: 24 }, (_, h) => (h % 3 ? "" : String(h).padStart(2, "0")));
const BANDS = REGIONS.map((r) => ({ from: r.from, to: r.to, label: r.label.replace(" evening", "") }));

/** A gap smaller than this (percentage points) is noise at these sample sizes. */
const MEANINGFUL = 0.5;
/** Each compared region needs this many trades before the verdict picks a winner. */
const MIN_REGION_TRADES = 20;

const pts = (p: number) => `${p >= 0 ? "+" : "−"}${Math.abs(p).toFixed(1)}`;

export function verdict(hours: Bucket[]): string {
  const idx = REGIONS.map((r) => ({ ...r, ...regionIndex(hours, r) }));
  const eu = idx.find((r) => r.id === "europe")!;
  if (eu.pct == null || eu.trades < MIN_REGION_TRADES) return "Not enough European-evening trades to compare.";
  const others = idx.filter((r) => r.id !== "europe" && r.pct != null && r.trades >= MIN_REGION_TRADES);
  const best = others.reduce<(typeof others)[number] | undefined>((a, b) => (!a || b.pct! > a.pct! ? b : a), undefined);
  if (!best) return "Not enough trades outside Europe's evening to compare.";
  const gap = best.pct! - eu.pct;
  if (gap > MEANINGFUL) return `Sell during the ${best.label}: about ${gap.toFixed(1)}% above the Europe evening.`;
  if (gap < -MEANINGFUL) return `The Europe evening pays best: ${(-gap).toFixed(1)}% above the ${best.label}.`;
  return "No real difference between regions: list whenever you play.";
}

export function Timing({
  id,
  hours,
  weekdays,
  scope,
  note,
}: {
  id: string;
  hours: Bucket[];
  weekdays: Bucket[];
  scope: string;
  /** Sample sizes, shown under the explanation. */
  note?: string;
}) {
  const idx = REGIONS.map((r) => ({ ...r, ...regionIndex(hours, r) }));
  const eu = idx.find((r) => r.id === "europe")!.pct;
  const noHours = hours.every((b) => b.trades === 0);
  return (
    <section aria-labelledby={id} className="border-line bg-panel rounded-[14px] border px-[18px] py-4">
      <h2 id={id} className="text-base font-semibold">
        When to sell · {scope}
      </h2>
      {noHours ? (
        <p className="mt-1 text-[13px]">
          No trades by hour in this data, so regions can&apos;t be compared yet. Hourly buckets cover the last 48 hours
          and come with each sweep; the weekday view below already works.
        </p>
      ) : (
        <>
          <p className="mt-1 text-[13px]">{verdict(hours)}</p>
          <RegionTiles idx={idx} eu={eu} />
          <h3 className="mt-4 text-[13px] font-semibold">By hour (UTC), last 48 hours</h3>
          <div className="mt-2">
            <ProfileChart bars={hours} ticks={HOUR_TICKS} bands={BANDS} label={`${scope}, price by UTC hour`} />
          </div>
        </>
      )}
      <h3 className="mt-4 text-[13px] font-semibold">By weekday (UTC), last 90 days</h3>
      <div className="mt-2">
        <ProfileChart bars={weekdays} ticks={[...WEEKDAYS]} label={`${scope}, price by weekday`} />
      </div>
      <p className="text-muted mt-3 text-xs leading-normal">
        Bars: median price vs the usual price (the 48-hour average for hours, the surrounding week for weekdays). Trades
        carry no location, so regions are inferred from who is awake (evenings, northern winter time). The hour view
        sees each hour only twice; it firms up as the daily sweep keeps history.
        {note ? ` Based on ${note}.` : ""}
      </p>
    </section>
  );
}

type RegionRow = (typeof REGIONS)[number] & Bucket;

function RegionTiles({ idx, eu }: { idx: RegionRow[]; eu: number | null }) {
  return (
    <ul className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2.5">
      {idx.map((r) => (
        <li key={r.id} className="border-line rounded-[10px] border px-3 py-2.5">
          <div className="text-muted text-xs">
            {r.label} · {String(r.from).padStart(2, "0")}–{String(r.to).padStart(2, "0")} UTC
          </div>
          <div className="num mt-1 text-lg">
            {r.pct == null ? (
              <span className="text-muted">—</span>
            ) : (
              <span className={r.pct >= 0 ? "text-up" : "text-down"}>{pts(r.pct)}%</span>
            )}
          </div>
          {r.id !== "europe" && r.pct != null && eu != null && (
            <div className="num text-muted text-[11px]">{pts(r.pct - eu)} pts vs Europe</div>
          )}
          <div className="num text-muted text-[11px]">{r.trades.toLocaleString("en-US")} trades</div>
        </li>
      ))}
    </ul>
  );
}
