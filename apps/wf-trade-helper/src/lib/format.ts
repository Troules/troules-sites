export const plat = (n: number) => `${Math.round(n).toLocaleString("en-US")}p`;

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export const trendText = (t: number) => `${t >= 0 ? "▲" : "▼"} ${Math.abs(t).toFixed(1)}%`;

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

/** A probability as a percent: one decimal below 10%, "<0.1%" for tiny non-zero chances. */
export function pct(p: number): string {
  if (p <= 0) return "0%";
  if (p < 0.001) return "<0.1%";
  if (p >= 0.9995) return p >= 1 ? "100%" : ">99.9%";
  return `${(p * 100).toFixed(p < 0.1 || p > 0.99 ? 1 : 0)}%`;
}
