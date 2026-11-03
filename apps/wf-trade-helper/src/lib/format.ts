export const plat = (n: number) => `${Math.round(n).toLocaleString("en-US")}p`;

export function compact(n: number): string {
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
